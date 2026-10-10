# --- Grid Up Telemetry Bridge Logic ---
import sys
import json
import time
import os
import random
import socket
import threading
import hashlib
import base64
import re
import irsdk
import firebase_admin
from firebase_admin import credentials, db, firestore
import urllib.request
import urllib.error

# Resolve base directory dynamically
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CONFIG_FILE = os.path.join(BASE_DIR, "config.json")
BRIDGE_VERSION = "1.5.1"
LOCAL_DASH_TOKEN = "9f88a761189d76af3351166d3cc820e6e4c9e5b901f5fb0261c8d24eac694f4b"

class TelemetryBridge:
    def __init__(self, status_callback=None):
        self.status_callback = status_callback
        self.ir = irsdk.IRSDK()
        self.running = False
        self.clients = set()
        self.clients_lock = threading.Lock()
        
        # Local dashboard streaming states
        self.local_batch_queue = []
        self.local_counter = 0
        
        # Load saved config
        self.config = {
            "teamId": "solo",
            "driverName": "GRiD UP Driver",
            "machineId": self.get_machine_id()
        }
        self.load_config()
        
        self.has_firebase = False
        self.init_firebase()
        self.sync_driver_name_from_db()
        self.sync_teams_from_db()
        
        # Session and recording state
        self.last_session_id = -1
        self.last_processed_lap = -1
        self.is_on_track = False
        self.stint_lap_count = 0
        self.stint_start_time = 0.0
        self.accum_throttle = []
        self.accum_brake = []
        self.accum_lock = threading.Lock()
        
        # High detail lap analysis variables
        self.current_lap_points = []
        self.last_lap_point_time = 0.0
        
        # Race reports states
        self.db_fs = None
        self.race_log = None
        self.active_driver_name = ""
        self.stint_start_lap = -1
        self.stint_start_fuel = -1.0
        self.stint_start_time = -1.0
        self.current_stint_laps = []

    def get_machine_id(self):
        try:
            import winreg
            registry = winreg.ConnectRegistry(None, winreg.HKEY_LOCAL_MACHINE)
            key = winreg.OpenKey(registry, r"SOFTWARE\Microsoft\Cryptography")
            value, regtype = winreg.QueryValueEx(key, "MachineGuid")
            return str(value).strip('{}').upper()
        except:
            return "standalone-bg-id"

    def load_config(self):
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r") as f:
                    data = json.load(f)
                    self.config.update(data)
            except Exception as e:
                self.log(f"Failed to load config: {e}")

    def save_config(self):
        try:
            with open(CONFIG_FILE, "w") as f:
                json.dump(self.config, f, indent=4)
        except Exception as e:
            self.log(f"Failed to save config: {e}")

    def init_firebase(self):
        # Look in _MEIPASS first if frozen (embedded data)
        if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
            key_path = os.path.join(getattr(sys, '_MEIPASS'), 'serviceAccountKey.json')
        else:
            key_path = os.path.join(BASE_DIR, 'serviceAccountKey.json')
            
        # Fallback to BASE_DIR if _MEIPASS path doesn't exist for some reason
        if not os.path.exists(key_path):
            key_path = os.path.join(BASE_DIR, 'serviceAccountKey.json')
            
        if os.path.exists(key_path):
            try:
                if not firebase_admin._apps:
                    cred = credentials.Certificate(key_path)
                    firebase_admin.initialize_app(cred, {
                        'databaseURL': 'https://grid-up-racedash-default-rtdb.europe-west1.firebasedatabase.app'
                    })
                self.db_fs = firestore.client()
                self.has_firebase = True
                self.log("Firebase initialized successfully (including Cloud Firestore).")
            except Exception as e:
                self.log(f"Firebase failed: {e}")
                self.has_firebase = False
                self.db_fs = None
        else:
            self.log("serviceAccountKey.json not found. Offline/local mode active.")
            self.has_firebase = False
            
    def sync_driver_name_from_db(self):
        if not self.has_firebase:
            return
        try:
            self.log("Syncing driver profile from cloud registry...")
            db_ref = db.reference(f"driver_registry/{self.config['machineId']}/name")
            db_name = db_ref.get()
            
            if db_name:
                db_name = str(db_name).strip()
                if db_name and db_name != self.config["driverName"]:
                    self.config["driverName"] = db_name
                    self.save_config()
                    self.log(f"Driver profile loaded from Cloud: {db_name}")
                    # Notify GUI of config change
                    if self.status_callback:
                        self.status_callback("config", self.config)
            else:
                # Name not in database yet. If we have a local name configured, write it to cloud
                local_name = self.config.get("driverName", "").strip()
                if local_name and local_name != "GRiD UP Driver":
                    db_ref.set(local_name)
                    self.log(f"Driver profile registered to Cloud: {local_name}")
        except Exception as e:
            self.log(f"Failed to sync driver profile from cloud: {e}")

    def sync_teams_from_db(self):
        if not self.has_firebase:
            return
        try:
            self.log("Syncing teams list from cloud config...")
            teams_ref = db.reference("config/teams")
            teams_data = teams_ref.get()
            
            if teams_data and isinstance(teams_data, dict):
                # Format: { "Display Name": "team_id", ... } sorted by 'order' or key
                team_items = []
                for tid, tinfo in teams_data.items():
                    if isinstance(tinfo, dict):
                        # only include enabled teams
                        if tinfo.get("enabled", True):
                            team_items.append((
                                tinfo.get("order", 999),
                                tinfo.get("name", tid),
                                tinfo.get("id", tid)
                            ))
                    elif isinstance(tinfo, str):
                        team_items.append((999, tinfo, tid))
                
                team_items.sort(key=lambda x: x[0])
                fetched_teams_dict = {item[1]: item[2] for item in team_items}
                
                if fetched_teams_dict:
                    self.log(f"Loaded {len(fetched_teams_dict)} active teams from Cloud config.")
                    if self.status_callback:
                        self.status_callback("teams", fetched_teams_dict)
        except Exception as e:
            self.log(f"Failed to sync teams from cloud: {e}")

    def send_local_post(self, path, payload):
        def worker():
            try:
                url = f"http://localhost:3000{path}"
                data = json.dumps(payload).encode('utf-8')
                req = urllib.request.Request(
                    url,
                    data=data,
                    headers={
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {LOCAL_DASH_TOKEN}'
                    },
                    method='POST'
                )
                with urllib.request.urlopen(req, timeout=1.0) as response:
                    response.read()
            except Exception as e:
                pass # Silent local server down
        threading.Thread(target=worker, daemon=True).start()

    def log(self, message):
        log_msg = f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] [Bridge] {message}"
        print(log_msg)
        try:
            log_file = os.path.join(BASE_DIR, "telemetry_recorder.log")
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(log_msg + "\n")
        except:
            pass
        if self.status_callback:
            self.status_callback("log", message)

    # --- WebSocket Server Implementation ---
    def start_websocket_server(self):
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            server.bind(("127.0.0.1", 23099))
            server.listen(5)
            self.log("WebSocket server listening on ws://127.0.0.1:23099")
        except Exception as e:
            self.log(f"WebSocket server failed to bind: {e}")
            return

        def handle_client(client_socket):
            try:
                request = client_socket.recv(4096).decode('utf-8', errors='ignore')
                if "Upgrade: websocket" not in request:
                    client_socket.close()
                    return

                key_match = re.search(r"Sec-WebSocket-Key:\s*(\S+)", request)
                if not key_match:
                    client_socket.close()
                    return

                key = key_match.group(1)
                guid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
                accept_hash = hashlib.sha1((key + guid).encode('utf-8')).digest()
                accept_key = base64.b64encode(accept_hash).decode('utf-8')

                response = (
                    "HTTP/1.1 101 Switching Protocols\r\n"
                    "Upgrade: websocket\r\n"
                    "Connection: Upgrade\r\n"
                    f"Sec-WebSocket-Accept: {accept_key}\r\n\r\n"
                )
                client_socket.send(response.encode('utf-8'))
                
                with self.clients_lock:
                    self.clients.add(client_socket)
                self.log("Client connected to local telemetry WebSocket.")

                while self.running:
                    header = client_socket.recv(2)
                    if not header or len(header) < 2:
                        break
                    
                    second_byte = header[1]
                    masked = (second_byte & 128) != 0
                    payload_len = second_byte & 127
                    
                    if payload_len == 126:
                        payload_len = int.from_bytes(client_socket.recv(2), byteorder='big')
                    elif payload_len == 127:
                        payload_len = int.from_bytes(client_socket.recv(8), byteorder='big')
                        
                    if masked:
                        mask_key = client_socket.recv(4)
                        
                    payload = client_socket.recv(payload_len)
                    if masked:
                        decoded = bytearray(payload_len)
                        for i in range(payload_len):
                            decoded[i] = payload[i] ^ mask_key[i % 4]
                        payload = decoded
                        
                    try:
                        cmd = json.loads(payload.decode('utf-8'))
                        self.process_command(cmd)
                    except Exception as e:
                        pass
            except Exception as e:
                pass
            finally:
                with self.clients_lock:
                    self.clients.discard(client_socket)
                try:
                    client_socket.close()
                except:
                    pass
                self.log("Client disconnected from local telemetry WebSocket.")

        def accept_loop():
            while self.running:
                try:
                    server.settimeout(1.0)
                    client, addr = server.accept()
                    threading.Thread(target=handle_client, args=(client,), daemon=True).start()
                except socket.timeout:
                    continue
                except Exception as e:
                    break

        threading.Thread(target=accept_loop, daemon=True).start()

    def broadcast(self, data):
        payload = json.dumps(data).encode('utf-8')
        payload_len = len(payload)
        
        frame = bytearray()
        frame.append(129)
        
        if payload_len <= 125:
            frame.append(payload_len)
        elif payload_len <= 65535:
            frame.append(126)
            frame.extend(payload_len.to_bytes(2, byteorder='big'))
        else:
            frame.append(127)
            frame.extend(payload_len.to_bytes(8, byteorder='big'))
            
        frame.extend(payload)
        
        closed_clients = []
        with self.clients_lock:
            for client in self.clients:
                try:
                    client.sendall(frame)
                except:
                    closed_clients.append(client)
            for client in closed_clients:
                self.clients.discard(client)

    def process_command(self, cmd):
        action = cmd.get("action")
        if action == "set_team":
            self.config["teamId"] = cmd.get("teamId", "solo")
            self.save_config()
            self.log(f"Target Team Locked: {self.config['teamId']}")
            if self.status_callback:
                self.status_callback("config", self.config)
        elif action == "set_name":
            name = cmd.get("name", "GRiD UP Driver").strip()
            self.config["driverName"] = name
            self.save_config()
            self.log(f"Driver Name Locked: {self.config['driverName']}")
            if self.has_firebase and name != "GRiD UP Driver":
                try:
                    db.reference(f"driver_registry/{self.config['machineId']}/name").set(name)
                    self.log("Driver Name updated in Cloud registry.")
                except Exception as e:
                    self.log(f"Failed to save driver name to Cloud: {e}")
            if self.status_callback:
                self.status_callback("config", self.config)
        elif action == "set_mid":
            self.config["machineId"] = cmd.get("mid", "").upper()
            self.save_config()
            self.log(f"Machine ID Locked: {self.config['machineId']}")
            if self.status_callback:
                self.status_callback("config", self.config)

    # --- Telemetry Processing & Sync ---
    def get_safe(self, key, default_val=0):
        try:
            if key in self.ir.var_headers_names:
                val = self.ir[key]
                return val if val is not None else default_val
        except:
            pass
        return default_val

    def get_array_val(self, array_name, index, default_val=0):
        try:
            arr = self.get_safe(array_name, [])
            if type(arr) in (list, tuple) and index >= 0 and index < len(arr):
                val = arr[index]
                return val if val is not None else default_val
        except Exception as e:
            self.log(f"Error accessing array {array_name} at index {index}: {e}")
        return default_val

    def get_telemetry_data(self, consume=False):
        if not self.ir.is_connected and not self.ir.startup():
            return None
            
        try:
            f2_times = self.get_safe('CarIdxF2Time', [])
            my_idx = self.get_safe('PlayerCarIdx', -1)
            cam_car_idx = self.get_safe('CamCarIdx', -1)
            is_player_on_track = bool(self.get_safe('IsOnTrack', False))

            # Spectating detection:
            # If camera is focused on another car, or player is not actively on track:
            is_spectating = False
            target_car_idx = my_idx
            if cam_car_idx is not None and cam_car_idx >= 0:
                if cam_car_idx != my_idx or not is_player_on_track:
                    target_car_idx = cam_car_idx
                    is_spectating = True

            if target_car_idx < 0 and my_idx >= 0:
                target_car_idx = my_idx
                is_spectating = False

            self.is_spectating_active = is_spectating

            gap_ahead = "--"
            gap_behind = "--"
            ref_idx = target_car_idx if target_car_idx >= 0 else my_idx
            if type(f2_times) in (list, tuple) and len(f2_times) > 0 and ref_idx >= 0:
                ahead = [t for i, t in enumerate(f2_times) if t > 0 and i != ref_idx]
                behind = [t for i, t in enumerate(f2_times) if t < 0 and i != ref_idx]
                if ahead: gap_ahead = f"+{round(min(ahead), 1)}"
                if behind: gap_behind = f"{round(max(behind), 1)}"

            # Weekend / Track info
            weekend_info = self.ir['WeekendInfo']
            track_id = 1
            track_name = 'iRacing UI'
            sid = -1
            if weekend_info:
                sid = weekend_info.get('SubSessionID', -1)
                if sid == -1 or sid is None:
                    sid = 999900 + (track_id % 100)
                track_id = weekend_info.get('TrackID') or weekend_info.get('trackID') or 1
                track_name = weekend_info.get('TrackName') or weekend_info.get('trackName') or 'iRacing'

            track_len_str = weekend_info.get('TrackLength', '4000').split(' ')[0] if weekend_info else '4000'
            track_len_unit = weekend_info.get('TrackLength', 'km').split(' ')[1] if weekend_info else 'km'
            try:
                track_len = float(track_len_str)
                if 'km' in track_len_unit.lower(): track_len *= 1000
                elif 'mi' in track_len_unit.lower(): track_len *= 1609.34
            except:
                track_len = 4000

            # Drivers Info & Arrays
            drivers = {}
            driver_info = self.ir['DriverInfo']
            
            pos_arr = self.get_safe('CarIdxPosition', [])
            class_pos_arr = self.get_safe('CarIdxClassPosition', [])
            lap_arr = self.get_safe('CarIdxLap', [])
            last_lap_arr = self.get_safe('CarIdxLastLapTime', [])
            best_lap_arr = self.get_safe('CarIdxBestLapTime', [])
            track_surface_arr = self.get_safe('CarIdxTrackSurface', [])
            lap_dist_arr = self.get_safe('CarIdxLapDistPct', [])
            gear_arr = self.get_safe('CarIdxGear', [])
            rpm_arr = self.get_safe('CarIdxRPM', [])

            if not hasattr(self, 'car_prev_progress'):
                self.car_prev_progress = {}
                self.car_prev_time = time.time()

            now_ts = time.time()
            dt = max(0.01, now_ts - getattr(self, 'car_prev_time', now_ts - 0.1))

            target_driver_meta = None
            if driver_info and 'Drivers' in driver_info:
                for d in driver_info['Drivers']:
                    idx = d['CarIdx']
                    if idx == target_car_idx:
                        target_driver_meta = d

                    dist = lap_dist_arr[idx] if (type(lap_dist_arr) in (list, tuple) and idx < len(lap_dist_arr)) else -1.0
                    surface = track_surface_arr[idx] if (type(track_surface_arr) in (list, tuple) and idx < len(track_surface_arr)) else -1
                    
                    if dist >= 0:
                        driver_pos = pos_arr[idx] if (type(pos_arr) in (list, tuple) and idx < len(pos_arr)) else 0
                        driver_class_pos = class_pos_arr[idx] if (type(class_pos_arr) in (list, tuple) and idx < len(class_pos_arr)) else 0
                        driver_lap = lap_arr[idx] if (type(lap_arr) in (list, tuple) and idx < len(lap_arr)) else 0
                        driver_last = last_lap_arr[idx] if (type(last_lap_arr) in (list, tuple) and idx < len(last_lap_arr)) else -1.0
                        driver_best = best_lap_arr[idx] if (type(best_lap_arr) in (list, tuple) and idx < len(best_lap_arr)) else -1.0
                        driver_gear = gear_arr[idx] if (type(gear_arr) in (list, tuple) and idx < len(gear_arr)) else 0
                        driver_rpm = rpm_arr[idx] if (type(rpm_arr) in (list, tuple) and idx < len(rpm_arr)) else 0.0
                        f2_val = f2_times[idx] if (type(f2_times) in (list, tuple) and idx < len(f2_times)) else 0.0

                        # Speed estimation
                        car_speed = 0.0
                        prev_p = self.car_prev_progress.get(idx, dist)
                        if dist >= 0 and prev_p >= 0 and dt > 0.01:
                            d_prog = dist - prev_p
                            if d_prog < -0.5:
                                d_prog += 1.0  # crossed finish line
                            if 0.0 <= d_prog < 0.2:
                                car_speed = round((d_prog * track_len) / dt, 1)

                        self.car_prev_progress[idx] = dist

                        drivers[str(idx)] = {
                            'name': d['UserName'],
                            'carNum': d['CarNumber'],
                            'classId': d['CarClassID'],
                            'className': d.get('CarClassShortName', str(d['CarClassID'])),
                            'classColor': hex(d['CarClassColor'])[2:].zfill(6),
                            'carPath': d.get('CarPath', ''),
                            'progress': dist,
                            'surface': surface,
                            'pos': driver_pos,
                            'classPos': driver_class_pos,
                            'lap': driver_lap,
                            'lastLap': driver_last,
                            'bestLap': driver_best,
                            'gear': driver_gear,
                            'rpm': round(driver_rpm),
                            'speed': car_speed,
                            'isPlayer': idx == my_idx,
                            'f2Time': f2_val
                        }

            self.car_prev_time = now_ts
            self.ir.freeze_var_buffer_latest()

            fuel_current = self.get_safe('FuelLevel', 0)
            current_lap_num = self.get_safe('Lap', 0)

            # Target Car telemetry resolution
            target_name = target_driver_meta['UserName'] if target_driver_meta else self.config.get('driverName', 'Active Driver')
            target_car_num = target_driver_meta['CarNumber'] if target_driver_meta else self.get_safe('CarNumber', '-')

            target_pos = class_pos_arr[target_car_idx] if (type(class_pos_arr) in (list, tuple) and target_car_idx < len(class_pos_arr) and class_pos_arr[target_car_idx] > 0) else (pos_arr[target_car_idx] if (type(pos_arr) in (list, tuple) and target_car_idx < len(pos_arr)) else 0)
            target_lap = lap_arr[target_car_idx] if (type(lap_arr) in (list, tuple) and target_car_idx < len(lap_arr)) else current_lap_num
            target_progress = lap_dist_arr[target_car_idx] if (type(lap_dist_arr) in (list, tuple) and target_car_idx < len(lap_dist_arr) and lap_dist_arr[target_car_idx] >= 0) else round(self.get_safe('LapDistPct', 0), 5)
            target_last_lap = last_lap_arr[target_car_idx] if (type(last_lap_arr) in (list, tuple) and target_car_idx < len(last_lap_arr)) else -1.0
            target_best_lap = best_lap_arr[target_car_idx] if (type(best_lap_arr) in (list, tuple) and target_car_idx < len(best_lap_arr)) else -1.0

            target_gear = gear_arr[target_car_idx] if (type(gear_arr) in (list, tuple) and target_car_idx < len(gear_arr)) else self.get_safe('Gear', 0)
            target_rpm = rpm_arr[target_car_idx] if (type(rpm_arr) in (list, tuple) and target_car_idx < len(rpm_arr)) else self.get_safe('RPM', 0)

            # Speed
            if not is_spectating and is_player_on_track:
                target_speed = self.get_safe('Speed', 0)
            else:
                target_speed = drivers.get(str(target_car_idx), {}).get('speed', 0.0)

            # Delta to fastest lap
            delta = 0.0
            if not is_spectating and self.get_safe('LapDeltaToBestLap') is not None:
                delta = round(self.get_safe('LapDeltaToBestLap', 0.0), 3)
            elif target_best_lap > 15.0 and target_last_lap > 15.0:
                delta = round(target_last_lap - target_best_lap, 3)

            # Simple laps remaining calculation
            if not hasattr(self, 'fuel_history'):
                self.fuel_history = []
                self.last_fuel_level = fuel_current
                self.last_lap_num = -1

            if current_lap_num > self.last_lap_num and self.last_lap_num != -1:
                consumption = self.last_fuel_level - fuel_current
                if 0 < consumption < 20:
                    self.fuel_history.append(consumption)
                    if len(self.fuel_history) > 3:
                        self.fuel_history.pop(0)
                self.last_fuel_level = fuel_current
                self.last_lap_num = current_lap_num
            elif self.last_lap_num == -1:
                self.last_lap_num = current_lap_num
                self.last_fuel_level = fuel_current

            laps_rem = int(fuel_current / max(sum(self.fuel_history)/len(self.fuel_history), 0.1)) if self.fuel_history else int(fuel_current / 3.0)

            # ABS Intervention
            is_abs = False
            try:
                if 'BrakeABSactive' in self.ir.var_headers_names:
                    is_abs = bool(self.ir['BrakeABSactive'])
                else:
                    brake_raw = self.ir['BrakeRaw']
                    brake_actual = self.ir['Brake']
                    if brake_raw is not None and brake_actual is not None:
                        if brake_raw > (brake_actual + 0.05) and brake_actual > 0.1:
                            is_abs = True
            except:
                pass

            with self.accum_lock:
                if self.accum_throttle:
                    current_throttle = sum(self.accum_throttle) / len(self.accum_throttle)
                    current_brake = sum(self.accum_brake) / len(self.accum_brake)
                    if consume:
                        self.accum_throttle = []
                        self.accum_brake = []
                else:
                    current_throttle = self.get_safe('Throttle', 0.0)
                    current_brake = self.get_safe('BrakeRaw', 0.0) or self.get_safe('Brake', 0.0)

            # Pedals & Fuel
            if not is_spectating and is_player_on_track:
                target_throttle = int(current_throttle * 100)
                target_brake = int(current_brake * 100)
                target_brake_applied = int(self.get_safe('Brake', 0) * 100)
                target_fuel = round(self.get_safe('FuelLevel', 0), 2)
                target_abs = is_abs
            else:
                target_throttle = 0
                target_brake = 0
                target_brake_applied = 0
                target_fuel = 0.0
                target_abs = False

            telemetry = {
                'speed': target_speed,
                'rpm': int(target_rpm),
                'gear': target_gear,
                'throttle': target_throttle,
                'brake': target_brake,
                'brake_applied': target_brake_applied,
                'fuel': target_fuel,
                'lap': target_lap,
                'position': target_pos,
                'track_temp': round(self.get_safe('TrackTemp', 0), 1),
                'air_temp': round(self.get_safe('AirTemp', 0), 1),
                'wind_vel': round(self.get_safe('WindVel', 0) * 3.6, 1),
                'wind_dir': round(self.get_safe('WindDir', 0), 2),
                'timestamp': time.time(),
                'abs': target_abs,
                'gap_ahead': gap_ahead,
                'gap_behind': gap_behind,
                'steering': round(self.get_safe('SteeringWheelAngle', 0), 3) if not is_spectating else 0.0,
                'delta': delta,
                'progress': target_progress,
                'lat': self.get_safe('Lat', 0) or self.get_safe('PlayerCarLat', 0),
                'lon': self.get_safe('Lon', 0) or self.get_safe('PlayerCarLon', 0),
                'health': {
                    'oilTemp': round(self.get_safe('OilTemp', 0), 1),
                    'waterTemp': round(self.get_safe('WaterTemp', 0), 1),
                    'oilPress': round(self.get_safe('OilPress', 0), 2),
                    'tyres': {
                        'LF': { 'p': round(self.get_safe('LFcoldPressure', 0), 1), 't': round(self.get_safe('LFtempCM', 0), 1) },
                        'RF': { 'p': round(self.get_safe('RFcoldPressure', 0), 1), 't': round(self.get_safe('RFtempCM', 0), 1) },
                        'LR': { 'p': round(self.get_safe('LRcoldPressure', 0), 1), 't': round(self.get_safe('LRtempCM', 0), 1) },
                        'RR': { 'p': round(self.get_safe('RRcoldPressure', 0), 1), 't': round(self.get_safe('RRtempCM', 0), 1) }
                    }
                },
                'session_time': round(self.get_safe('SessionTime', 0.0), 3),
                'drivers': drivers,
                'is_live': True,
                'v': BRIDGE_VERSION,
                # Spectator & Delta Extensions
                'isSpectating': is_spectating,
                'spectatingCarIdx': target_car_idx,
                'spectatingCarNum': target_car_num,
                'spectatingDriverName': target_name,
                'camCarIdx': cam_car_idx,
                'playerIdx': my_idx,
                'driverName': target_name,
                'carNum': target_car_num,
                'bestLap': target_best_lap,
                'lastLap': target_last_lap
            }

            session = {
                'active': True,
                'sid': sid,
                'trackId': track_id,
                'trackName': track_name,
                'trackLength': track_len,
                'fuel_level': fuel_current,
                'laps_remaining': laps_rem,
                'session_time_remain': self.get_safe('SessionTimeRemain', 0),
                'is_live': True
            }
            return telemetry, session
        except Exception as e:
            import traceback
            self.log(f"Telemetry retrieval error: {e}\n{traceback.format_exc()}")
            return None

    def simulate_telemetry(self):
        telemetry = {
            'speed': 0, 'rpm': 0, 'gear': 0, 'throttle': 0, 'brake': 0, 'fuel': 0, 'lap': 0, 'position': 0, 'is_live': False, 'v': BRIDGE_VERSION
        }
        session = {
            'active': False, 'sid': -1, 'trackName': 'WAITING FOR SIMULATION...', 'is_live': False
        }
        return telemetry, session

    def loop(self):
        self.running = True
        self.start_websocket_server()
        
        def sampler():
            while self.running:
                if self.ir.is_connected:
                    try:
                        with self.accum_lock:
                            self.accum_throttle.append(float(self.get_safe('Throttle', 0.0)))
                            self.accum_brake.append(float(self.get_safe('BrakeRaw', 0.0) or self.get_safe('Brake', 0.0)))
                            if len(self.accum_throttle) > 100:
                                self.accum_throttle.pop(0)
                                self.accum_brake.pop(0)
                    except:
                        pass
                time.sleep(0.003)

        threading.Thread(target=sampler, daemon=True).start()

        last_fb_update = 0
        last_presence_update = 0
        last_conn_status = False

        while self.running:
            loop_start = time.time()
            curr_conn = self.ir.is_connected
            
            if curr_conn != last_conn_status:
                self.log(f"iRacing Connection: {'Connected' if curr_conn else 'Disconnected'}")
                if not curr_conn:
                    self.save_race_log()
                    self.send_local_post("/api/bridge/end_session", {})
                    try:
                        self.ir.shutdown()
                    except:
                        pass
                if self.status_callback:
                    self.status_callback("connection", curr_conn)
                last_conn_status = curr_conn

            current_interval = 0.2 if (curr_conn and (self.is_on_track or getattr(self, 'is_spectating_active', False))) else 1.0
            should_consume = (loop_start - last_fb_update) >= current_interval
            
            result = self.get_telemetry_data(consume=should_consume)
            if result:
                telemetry, session = result
                
                # Initialize race log if session changes or starts
                sid = session.get('sid', -1)
                if sid != -1:
                    self.check_session_init(sid, telemetry, session)
                    # Periodically re-sync local dashboard session status (every 5 seconds)
                    if not hasattr(self, 'last_local_start_post'):
                        self.last_local_start_post = 0.0
                    now = time.time()
                    if now - self.last_local_start_post > 5.0:
                        self.last_local_start_post = now
                        player_car = "Unknown Car"
                        try:
                            driver_info = self.ir['DriverInfo']
                            my_idx = self.get_safe('PlayerCarIdx', -1)
                            if driver_info and 'Drivers' in driver_info:
                                for d in driver_info['Drivers']:
                                    if d['CarIdx'] == my_idx:
                                        player_car = d.get('CarScreenName', 'Unknown Car')
                                        break
                        except:
                            pass
                        self.send_local_post("/api/bridge/start_session", {
                            "sessionId": sid,
                            "trackName": session.get('trackName', 'iRacing'),
                            "carName": player_car,
                            "driverName": self.config['driverName']
                        })
                    
                # Stint state and driver change detection
                self.check_stint_transition(telemetry)
                
                # Check for race incidents/overtakes
                self.check_race_events(telemetry)
                
                # Stream to local dashboard if on track
                if self.is_on_track:
                    self.local_counter += 1
                    # Sample at approx 30Hz (every 4 frames since loop runs at 120Hz)
                    if self.local_counter % 4 == 0:
                        frame = {
                            "lapDist": float(self.get_safe('LapDist', 0.0)),
                            "speed": float(telemetry.get('speed', 0.0)),
                            "throttle": float(telemetry.get('throttle', 0.0) / 100.0),
                            "brake": float(telemetry.get('brake', 0.0) / 100.0),
                            "gear": int(telemetry.get('gear', 0)),
                            "steeringAngle": float(telemetry.get('steering', 0.0)),
                            "timestamp": float(telemetry.get('session_time', 0.0)),
                            "latAccel": float(self.get_safe('LatAccel', 0.0)),
                            "longAccel": float(self.get_safe('LongAccel', 0.0)),
                            "lfTemp": float(self.get_safe('LFtempCL', 0.0)),
                            "rfTemp": float(self.get_safe('RFtempCL', 0.0)),
                            "lrTemp": float(self.get_safe('LRtempCL', 0.0)),
                            "rrTemp": float(self.get_safe('RRtempCL', 0.0)),
                            "fuelLevel": float(telemetry.get('fuel', 0.0)),
                            "trackTemp": float(telemetry.get('track_temp', 0.0)),
                            "airTemp": float(telemetry.get('air_temp', 0.0)),
                            "tyreCompound": int(self.get_safe('PlayerTireCompound', 0))
                        }
                        self.local_batch_queue.append(frame)

                        # Flush batch when it reaches 10 frames (about every 0.3s)
                        if len(self.local_batch_queue) >= 10:
                            self.send_local_post("/api/bridge/telemetry_batch", {"frames": list(self.local_batch_queue)})
                            self.local_batch_queue.clear()

                    # Collect high-density lap points (60Hz - iRacing Native Max) for detailed analysis
                    now_time = time.time()
                    if now_time - self.last_lap_point_time >= 0.015:
                        self.last_lap_point_time = now_time
                        lap_dist_pct = self.get_safe('LapDistPct', 0.0)
                        if 0.0 <= lap_dist_pct <= 1.0:
                            my_idx = self.get_safe('PlayerCarIdx', -1)
                            idx_lats = self.get_safe('CarIdxLat', [])
                            idx_lons = self.get_safe('CarIdxLon', [])
                            car_idx_lat = idx_lats[my_idx] if (type(idx_lats) in (list, tuple) and my_idx >= 0 and my_idx < len(idx_lats)) else 0.0
                            car_idx_lon = idx_lons[my_idx] if (type(idx_lons) in (list, tuple) and my_idx >= 0 and my_idx < len(idx_lons)) else 0.0
                            
                            raw_lat = float(self.get_safe('Lat', 0.0) or self.get_safe('PlayerCarLat', 0.0) or car_idx_lat or 0.0)
                            raw_lon = float(self.get_safe('Lon', 0.0) or self.get_safe('PlayerCarLon', 0.0) or car_idx_lon or 0.0)

                            self.current_lap_points.append({
                                'pct': round(float(lap_dist_pct), 5),
                                'lat': raw_lat,
                                'lon': raw_lon,
                                'spd': float(telemetry.get('speed', 0.0)),
                                'rpm': int(telemetry.get('rpm', 0)),
                                'thr': int(telemetry.get('throttle', 0.0)),
                                'brk': int(telemetry.get('brake', 0.0)),
                                'str': round(float(telemetry.get('steering', 0.0)), 3),
                                'abs': bool(telemetry.get('abs', False)),
                                'gear': int(telemetry.get('gear', 0)),
                                'lata': round(float(self.get_safe('LatAccel', 0.0)), 2),
                                'lona': round(float(self.get_safe('LongAccel', 0.0)), 2)
                            })
                            
                velocity = telemetry.get('speed', 0)
                if not self.is_on_track and velocity > 1:
                    self.is_on_track = True
                    self.stint_lap_count = 0
                    self.stint_start_time = time.time()
                elif self.is_on_track and velocity < 0.5:
                    if not hasattr(self, 'stop_timer'):
                        self.stop_timer = time.time()
                    if time.time() - self.stop_timer > 5.0:
                        self.is_on_track = False
                else:
                    self.stop_timer = time.time()
                    
                curr_lap = telemetry.get('lap', -1)
                if self.last_processed_lap == -1 and curr_lap != -1:
                    self.last_processed_lap = curr_lap
                    self.current_lap_points = []
                elif curr_lap > self.last_processed_lap and self.last_processed_lap != -1:
                    self.stint_lap_count += 1
                    
                    # Log completed lap
                    last_lap_time = self.get_safe('LapLastLapTime', -1.0)
                    if last_lap_time > 0:
                        self.log_completed_lap(self.last_processed_lap, last_lap_time, telemetry)
                        
                        # Upload high-density lap details for track analysis
                        if self.has_firebase and self.current_lap_points:
                            try:
                                lap_num_str = str(self.last_processed_lap)
                                # Resolve car name for player
                                player_car = "Unknown Car"
                                try:
                                    driver_info = self.ir['DriverInfo']
                                    my_idx = self.get_safe('PlayerCarIdx', -1)
                                    if driver_info and 'Drivers' in driver_info:
                                        for d in driver_info['Drivers']:
                                            if d['CarIdx'] == my_idx:
                                                player_car = d.get('CarScreenName', 'Unknown Car')
                                                break
                                except:
                                    pass

                                db.reference(f"teams/{self.config['teamId']}/laps_analysis/{self.config['machineId']}/laps/{lap_num_str}").set({
                                    'lap_num': self.last_processed_lap,
                                    'lap_time': round(last_lap_time, 3),
                                    'driver_name': self.config['driverName'],
                                    'points': self.current_lap_points,
                                    'timestamp': time.time(),
                                    'track_name': session.get('trackName', 'Unknown Track'),
                                    'track_id': session.get('trackId', 1),
                                    'car_name': player_car
                                })
                                
                                # Duplicate to 'best' if this matches best session lap
                                best_lap_time = self.get_safe('LapBestLapTime', -1.0)
                                if abs(last_lap_time - best_lap_time) < 0.05 or best_lap_time <= 0:
                                    db.reference(f"teams/{self.config['teamId']}/laps_analysis/{self.config['machineId']}/best").set({
                                        'lap_num': self.last_processed_lap,
                                        'lap_time': round(last_lap_time, 3),
                                        'driver_name': self.config['driverName'],
                                        'points': self.current_lap_points,
                                        'timestamp': time.time(),
                                        'track_name': session.get('trackName', 'Unknown Track'),
                                        'track_id': session.get('trackId', 1),
                                        'car_name': player_car
                                    })
                            except Exception as e:
                                self.log(f"Failed to upload lap telemetry analysis: {e}")
                                
                    self.last_processed_lap = curr_lap
                    self.current_lap_points = []
                
                telemetry['stint_laps'] = self.stint_lap_count
                telemetry['sid'] = session.get('sid', -1)
            else:
                telemetry, session = self.simulate_telemetry()

            packet = {
                'telemetry': telemetry,
                'session': session,
                'is_live': session.get('is_live', False),
                'v': BRIDGE_VERSION
            }
            self.broadcast(packet)

            if self.has_firebase and curr_conn:
                is_spec = telemetry.get('isSpectating', False) if isinstance(telemetry, dict) else False
                spec_name = telemetry.get('driverName') if is_spec else self.config['driverName']
                spec_num = telemetry.get('carNum') if is_spec else self.get_safe('CarNumber', '-')

                if (loop_start - last_presence_update) >= 5.0:
                    try:
                        presence = {
                            'name': spec_name or self.config['driverName'],
                            'status': 'online',
                            'lastActive': {'.sv': 'timestamp'},
                            'protocol': 'v2',
                            'carNum': spec_num or '-',
                            'isSpectating': is_spec,
                            'spectatingDriver': spec_name if is_spec else None,
                            'spectatingCarNum': spec_num if is_spec else None
                        }
                        db.reference(f"teams/{self.config['teamId']}/drivers/{self.config['machineId']}").set(presence)
                        last_presence_update = loop_start
                    except Exception as e:
                        pass
                
                if should_consume:
                    try:
                        diag_msg = f"Streaming Spectating (#{spec_num} {spec_name})" if is_spec else 'Streaming Standalone'
                        heartbeat = {
                            'telemetry': telemetry,
                            'session': session,
                            'timestamp': time.time(),
                            'is_live': True,
                            'v': BRIDGE_VERSION,
                            'diag': {'status': 'OK', 'msg': diag_msg}
                        }
                        db.reference(f"teams/{self.config['teamId']}/streams/{self.config['machineId']}").set(heartbeat)
                        last_fb_update = loop_start
                    except Exception as e:
                        pass

            elapsed = time.time() - loop_start
            sleep_time = max(0, (1.0 / 120.0) - elapsed)
            time.sleep(sleep_time)

    def check_session_init(self, sid, telemetry, session_data):
        if not sid or sid == -1:
            return
            
        if not hasattr(self, 'race_log') or self.race_log is None or self.race_log.get('session_info', {}).get('sid') != sid:
            # If we had a previous session log, save it before starting a new one
            if hasattr(self, 'race_log') and self.race_log is not None:
                self.save_race_log()
                
            self.log(f"Starting new race log for Session ID: {sid}")
            
            # Resolve car name for player
            player_car = "Unknown Car"
            try:
                driver_info = self.ir['DriverInfo']
                my_idx = self.get_safe('PlayerCarIdx', -1)
                if driver_info and 'Drivers' in driver_info:
                    for d in driver_info['Drivers']:
                        if d['CarIdx'] == my_idx:
                            player_car = d.get('CarScreenName', 'Unknown Car')
                            break
            except:
                pass
            
            # Post start_session locally to dashboard
            self.send_local_post("/api/bridge/start_session", {
                "sessionId": sid,
                "trackName": session_data.get('trackName', 'iRacing'),
                "carName": player_car,
                "driverName": self.config['driverName']
            })

            weekend_info = self.ir['WeekendInfo'] or {}
            session_type = "Practice"
            try:
                # Retrieve session type from YAML info
                if weekend_info and 'SessionInfo' in self.ir.session_info_dict:
                    sessions = self.ir.session_info_dict['SessionInfo']['Sessions']
                    sub_session_num = self.get_safe('SessionNum', 0)
                    if sub_session_num < len(sessions):
                        session_type = sessions[sub_session_num].get('SessionType', 'Practice')
            except Exception as e:
                pass
                
            self.race_log = {
                'session_info': {
                    'sid': sid,
                    'trackId': session_data.get('trackId', 1),
                    'trackName': session_data.get('trackName', 'iRacing'),
                    'sessionType': session_type,
                    'date': time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
                    'driverName': self.config['driverName'],
                    'teamId': self.config['teamId']
                },
                'laps': [],
                'stints': [],
                'events': [],
                'summary': {
                    'total_laps': 0,
                    'fastest_lap': -1.0,
                    'fastest_lap_num': -1,
                    'avg_lap_time': -1.0,
                    'fuel_used': 0.0
                }
            }
            self.stint_start_lap = telemetry.get('lap', 1)
            self.stint_start_fuel = telemetry.get('fuel', 0.0)
            self.stint_start_time = time.time()
            self.current_stint_laps = []
            self.active_driver_name = self.config['driverName']
            self.last_position = telemetry.get('position', 0)
            self.last_incident_count = self.get_safe('PlayerCarIncidentCount', 0)

    def log_completed_lap(self, lap_num, lap_time, telemetry):
        if not hasattr(self, 'race_log') or self.race_log is None:
            return
            
        # Avoid logging duplicate lap numbers
        if any(l['lap_num'] == lap_num for l in self.race_log['laps']):
            return
            
        # Calculate fuel used on this lap
        current_fuel = telemetry.get('fuel', 0.0)
        fuel_used = 0.0
        if len(self.race_log['laps']) > 0:
            prev_fuel = self.race_log['laps'][-1]['fuel_level']
            # If we didn't pit/refuel
            if prev_fuel > current_fuel:
                fuel_used = prev_fuel - current_fuel
        elif hasattr(self, 'stint_start_fuel') and self.stint_start_fuel > current_fuel:
            fuel_used = self.stint_start_fuel - current_fuel
            
        lap_entry = {
            'lap_num': lap_num,
            'lap_time': round(lap_time, 3),
            'fuel_level': round(current_fuel, 2),
            'fuel_used': round(max(0.0, fuel_used), 3),
            'position': telemetry.get('position', 0),
            'timestamp': time.time()
        }
        self.race_log['laps'].append(lap_entry)
        self.current_stint_laps.append(lap_entry)
        self.log(f"Logged Lap {lap_num}: {lap_time}s (Fuel Remaining: {current_fuel}L)")
        self.send_local_post("/api/bridge/end_lap", {"lapTime": lap_time})

    def check_stint_transition(self, telemetry):
        if not hasattr(self, 'race_log') or self.race_log is None:
            return
            
        # Get current surface of player
        my_idx = self.get_safe('PlayerCarIdx', -1)
        track_surface_arr = self.get_safe('CarIdxTrackSurface', [])
        surface = track_surface_arr[my_idx] if (type(track_surface_arr) in (list, tuple) and my_idx < len(track_surface_arr)) else -1
        in_pits = surface in (2, 3) # 2=stalls, 3=pit lane
        
        # If we entered pits, close current stint
        if in_pits and len(self.current_stint_laps) > 0:
            self.close_current_stint(reason="Pit Stop")
            
        # If we were in pits but are now back on track, start new stint
        if not in_pits and len(self.current_stint_laps) == 0 and hasattr(self, 'stint_start_lap') and self.stint_start_lap == -1:
            self.stint_start_lap = telemetry.get('lap', 1)
            self.stint_start_fuel = telemetry.get('fuel', 0.0)
            self.stint_start_time = time.time()
            
        # Check driver swap
        driver_name = self.config['driverName']
        if hasattr(self, 'active_driver_name') and self.active_driver_name and self.active_driver_name != driver_name:
            self.close_current_stint(reason="Driver Swap")
            self.active_driver_name = driver_name

    def close_current_stint(self, reason="End of Session"):
        if not hasattr(self, 'race_log') or self.race_log is None or len(self.current_stint_laps) == 0:
            return
            
        end_lap = self.current_stint_laps[-1]['lap_num']
        end_fuel = self.current_stint_laps[-1]['fuel_level']
        end_time = time.time()
        
        # Calculate stats for the stint
        total_laps = len(self.current_stint_laps)
        fuel_used = self.stint_start_fuel - end_fuel
        duration = end_time - self.stint_start_time
        
        lap_times = [l['lap_time'] for l in self.current_stint_laps if l['lap_time'] > 0]
        avg_lap = round(sum(lap_times) / len(lap_times), 3) if lap_times else 0.0
        best_lap = min(lap_times) if lap_times else 0.0
        
        stint_entry = {
            'stint_num': len(self.race_log['stints']) + 1,
            'driver': self.active_driver_name or self.config['driverName'],
            'start_lap': self.stint_start_lap,
            'end_lap': end_lap,
            'total_laps': total_laps,
            'avg_lap_time': avg_lap,
            'best_lap_time': best_lap,
            'fuel_used': round(max(0.0, fuel_used), 2),
            'duration_secs': int(duration),
            'reason_ended': reason
        }
        self.race_log['stints'].append(stint_entry)
        self.log(f"Closed Stint {stint_entry['stint_num']} for {stint_entry['driver']}: {total_laps} laps, Avg Pace: {avg_lap}s")
        
        # Reset stint markers
        self.stint_start_lap = -1
        self.stint_start_fuel = -1.0
        self.stint_start_time = -1.0
        self.current_stint_laps = []

    def save_race_log(self):
        if not hasattr(self, 'race_log') or self.race_log is None:
            return
            
        # Close any active stint first
        if len(self.current_stint_laps) > 0:
            self.close_current_stint(reason="Session Completed")
            
        laps = self.race_log['laps']
        if len(laps) == 0:
            # Nothing to save if no laps were completed
            self.race_log = None
            return
            
        sid = self.race_log['session_info']['sid']
        
        # Calculate summary stats
        lap_times = [l['lap_time'] for l in laps if l['lap_time'] > 0]
        fastest_lap = min(lap_times) if lap_times else -1.0
        fastest_lap_num = next((l['lap_num'] for l in laps if l['lap_time'] == fastest_lap), -1)
        avg_lap = round(sum(lap_times) / len(lap_times), 3) if lap_times else -1.0
        total_fuel = round(sum(l['fuel_used'] for l in laps), 2)
        
        self.race_log['summary'] = {
            'total_laps': len(laps),
            'fastest_lap': fastest_lap,
            'fastest_lap_num': fastest_lap_num,
            'avg_lap_time': avg_lap,
            'fuel_used': total_fuel
        }
        
        # Make directories if not exist
        logs_dir = os.path.join(BASE_DIR, "race_logs")
        if not os.path.exists(logs_dir):
            os.makedirs(logs_dir)
            
        log_file = os.path.join(logs_dir, f"session_{sid}.json")
        try:
            with open(log_file, "w") as f:
                json.dump(self.race_log, f, indent=4)
            self.log(f"Saved local race log to: {log_file}")
        except Exception as e:
            self.log(f"Failed to write local race log: {e}")
            
        # Upload to Firebase Firestore
        if self.has_firebase and self.db_fs:
            try:
                # Document ID is the SessionUniqueID (sid)
                self.db_fs.collection("race_logs").document(str(sid)).set(self.race_log)
                self.log(f"Uploaded race log to Cloud Firestore collection 'race_logs' document ID: {sid}")
            except Exception as e:
                self.log(f"Failed to upload race log to Firestore: {e}")
                
        self.race_log = None

    def check_race_events(self, telemetry):
        if not hasattr(self, 'race_log') or self.race_log is None:
            return
            
        curr_lap = telemetry.get('lap', 1)
        
        # 1. Position change / Overtake detection
        curr_pos = telemetry.get('position', 0)
        if curr_pos > 0:
            if hasattr(self, 'last_position') and self.last_position != -1 and curr_pos != self.last_position:
                event_type = "overtake" if curr_pos < self.last_position else "lost_position"
                pos_diff = abs(curr_pos - self.last_position)
                
                # Filter out massive position changes during start/reset
                if pos_diff < 15:
                    desc = f"Overtook car(s) to take P{curr_pos}" if event_type == "overtake" else f"Lost position to P{curr_pos}"
                    self.log_race_event(event_type, curr_lap, desc, metadata={
                        "pos_before": self.last_position,
                        "pos_after": curr_pos
                    })
            self.last_position = curr_pos
            
        # 2. Incident detection (PlayerCarIncidentCount)
        curr_incidents = self.get_safe('PlayerCarIncidentCount', 0)
        if hasattr(self, 'last_incident_count'):
            if curr_incidents > self.last_incident_count:
                inc_diff = curr_incidents - self.last_incident_count
                
                if inc_diff == 1:
                    event_type = "offtrack"
                    desc = "Went off-track (1x)"
                elif inc_diff == 2:
                    event_type = "spin"
                    desc = "Loss of control / Spin (2x)"
                elif inc_diff >= 4:
                    event_type = "crash"
                    desc = f"Collision / Car contact ({inc_diff}x)"
                else:
                    event_type = "incident"
                    desc = f"Incident logged ({inc_diff}x)"
                    
                self.log_race_event(event_type, curr_lap, desc, metadata={
                    "incidents_gained": inc_diff,
                    "total_incidents": curr_incidents
                })
        self.last_incident_count = curr_incidents
        
        # 3. Heavy G-force Impact detection
        lat_g = abs(self.get_safe('LatAccel', 0.0) / 9.81)
        long_g = abs(self.get_safe('LongAccel', 0.0) / 9.81)
        vert_g = abs((self.get_safe('VertAccel', 0.0) - 9.81) / 9.81)
        
        max_g = max(lat_g, long_g, vert_g)
        if max_g > 3.5:
            now = time.time()
            if not hasattr(self, 'last_impact_time') or (now - self.last_impact_time) > 8.0:
                self.last_impact_time = now
                self.log_race_event("impact", curr_lap, f"Heavy G impact detected ({round(max_g, 1)} G)", metadata={
                    "lat_g": round(lat_g, 2),
                    "long_g": round(long_g, 2),
                    "vert_g": round(vert_g, 2)
                })

    def log_race_event(self, event_type, lap_num, description, metadata=None):
        if not hasattr(self, 'race_log') or self.race_log is None:
            return
        if 'events' not in self.race_log:
            self.race_log['events'] = []
            
        event_entry = {
            'type': event_type,
            'lap_num': lap_num,
            'description': description,
            'timestamp': time.time(),
            'metadata': metadata or {}
        }
        self.race_log['events'].append(event_entry)
        self.log(f"Logged Race Event: [{event_type.upper()}] Lap {lap_num} - {description}")

    def stop(self):
        self.running = False
        self.save_race_log()
        self.ir.shutdown()
        self.send_local_post("/api/bridge/end_session", {})
        self.log("Telemetry Recorder Bridge Stopped")
