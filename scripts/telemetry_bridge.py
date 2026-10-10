#!/usr/bin/env python3
"""
GRiD UP Sim Racing - Live Telemetry & Spectator Bridge
Connects to iRacing shared memory and synchronizes real-time telemetry to Firebase RTDB.

Features:
- Full Player and Spectator tracking: Automatically tracks the car you are currently
  spectating (CamCarIdx) when not driving or when watching another driver.
- Live Delta calculation: Computes delta time to the tracked/spectated driver's fastest lap.
- Real-time Session Standings & Relative gaps synchronization for all cars on track.
- Zero-dependency Firebase HTTP streaming (uses standard library urllib).
"""

import sys
import time
import json
import argparse
import urllib.request
import urllib.error

try:
    import irsdk
except ImportError:
    print("[ERROR] 'pyirsdk' is not installed. Please run: pip install pyirsdk")
    sys.exit(1)

DEFAULT_STREAM_KEY = "839C6CC9-8C3E-D245-8683-0A40D1660F54"
DEFAULT_TEAM = "gridUp_sim"
RTDB_BASE_URL = "https://grid-up-racedash-default-rtdb.europe-west1.firebasedatabase.app"
BRIDGE_VERSION = "2.0.0-SPECTATOR"


class TelemetryBridge:
    def __init__(self, stream_key=DEFAULT_STREAM_KEY, team=DEFAULT_TEAM, hz=10):
        self.stream_key = stream_key
        self.team = team
        self.hz = max(1, min(hz, 30))
        self.interval = 1.0 / self.hz

        self.ir = irsdk.IRSDK()
        self.stream_url = f"{RTDB_BASE_URL}/teams/{self.team}/streams/{self.stream_key}.json"
        self.presence_url = f"{RTDB_BASE_URL}/teams/{self.team}/drivers/{self.stream_key}.json"

        # State tracking for speed calculation of spectated cars
        self.prev_time = 0.0
        self.prev_progress = {}
        self.last_presence_send = 0.0
        self.last_print = 0.0

    def run(self):
        print("=" * 65)
        print("   GRiD UP SIM RACING - LIVE TELEMETRY & SPECTATOR BRIDGE")
        print(f"   Version:    {BRIDGE_VERSION}")
        print(f"   Team:       {self.team}")
        print(f"   Stream Key: {self.stream_key}")
        print(f"   Rate:       {self.hz} Hz")
        print("=" * 65)
        print("[*] Waiting for iRacing to start...")

        while True:
            try:
                if not self.ir.is_connected:
                    if self.ir.startup():
                        print("\n[+] Connected to iRacing SDK!")
                    else:
                        time.sleep(1.0)
                        continue

                # Check if telemetry is actively available
                if not self.ir.is_initialized:
                    time.sleep(0.5)
                    continue

                self.process_tick()
                time.sleep(self.interval)

            except KeyboardInterrupt:
                print("\n[!] Stopping telemetry bridge...")
                break
            except Exception as e:
                print(f"[!] Error in main loop: {e}")
                time.sleep(1.0)

        self.ir.shutdown()
        print("[-] Bridge shut down cleanly.")

    def process_tick(self):
        now = time.time()
        self.ir.freeze_var_buffer_latest()

        # Session metadata
        session_info = self.ir['SessionInfo'] or {}
        driver_info = session_info.get('DriverInfo', {})
        drivers_list = driver_info.get('Drivers', [])
        drivers_by_idx = {d.get('CarIdx'): d for d in drivers_list if isinstance(d, dict) and 'CarIdx' in d}

        weekend_info = session_info.get('WeekendInfo', {})
        track_name = weekend_info.get('TrackName', 'iRacing UI')
        track_id = weekend_info.get('TrackID', 0)
        track_length_str = weekend_info.get('TrackLength', '5.0 km')

        # Parse track length into meters
        track_length_m = 5000.0
        try:
            if 'km' in track_length_str:
                track_length_m = float(track_length_str.replace('km', '').strip()) * 1000.0
            elif 'mi' in track_length_str:
                track_length_m = float(track_length_str.replace('mi', '').strip()) * 1609.34
        except Exception:
            track_length_m = 5000.0

        # Car Index Resolution
        cam_car_idx = self.ir['CamCarIdx']
        player_car_idx = self.ir['PlayerCarIdx']
        is_on_track = bool(self.ir['IsOnTrack'])

        # Determine if we are spectating
        # If camera is looking at another car, or player is not on track:
        is_spectating = False
        target_car_idx = player_car_idx

        if cam_car_idx is not None and cam_car_idx >= 0 and (cam_car_idx != player_car_idx or not is_on_track):
            target_car_idx = cam_car_idx
            is_spectating = True

        # Extract arrays for all cars in the session
        car_laps = self.ir['CarIdxLap'] or []
        car_progress = self.ir['CarIdxLapDistPct'] or []
        car_positions = self.ir['CarIdxPosition'] or []
        car_class_pos = self.ir['CarIdxClassPosition'] or []
        car_last_laps = self.ir['CarIdxLastLapTime'] or []
        car_best_laps = self.ir['CarIdxBestLapTime'] or []
        car_surfaces = self.ir['CarIdxTrackSurface'] or []
        car_gears = self.ir['CarIdxGear'] or []
        car_rpms = self.ir['CarIdxRPM'] or []
        car_f2_times = self.ir['CarIdxF2Time'] or []

        # Build comprehensive drivers map for Standings & Relative
        drivers_map = {}
        for idx, d_meta in drivers_by_idx.items():
            if idx is None or idx < 0:
                continue

            name = d_meta.get('UserName', f'Driver #{idx}')
            car_num = d_meta.get('CarNumber', str(idx))
            pos = car_positions[idx] if idx < len(car_positions) else 0
            c_pos = car_class_pos[idx] if idx < len(car_class_pos) else 0
            lap = car_laps[idx] if idx < len(car_laps) else 0
            prog = car_progress[idx] if idx < len(car_progress) else 0.0
            last_l = car_last_laps[idx] if idx < len(car_last_laps) else -1.0
            best_l = car_best_laps[idx] if idx < len(car_best_laps) else -1.0
            surface = car_surfaces[idx] if idx < len(car_surfaces) else 0
            gear = car_gears[idx] if idx < len(car_gears) else 0
            rpm = car_rpms[idx] if idx < len(car_rpms) else 0.0
            f2 = car_f2_times[idx] if idx < len(car_f2_times) else 0.0

            # Estimate car speed from progress delta if on track
            speed_val = 0.0
            dt = now - self.prev_time if self.prev_time > 0 else self.interval
            prev_p = self.prev_progress.get(idx, prog)
            if dt > 0.01 and 0.0 <= prog <= 1.0 and 0.0 <= prev_p <= 1.0:
                d_prog = prog - prev_p
                if d_prog < -0.5:
                    d_prog += 1.0  # crossed start/finish line
                if 0.0 <= d_prog < 0.2:
                    speed_val = round((d_prog * track_length_m) / dt, 1)

            self.prev_progress[idx] = prog

            drivers_map[str(idx)] = {
                'name': name,
                'carNum': car_num,
                'pos': pos,
                'classPos': c_pos,
                'lap': lap,
                'progress': max(0.0, min(prog, 1.0)),
                'lastLap': last_l,
                'bestLap': best_l,
                'gear': gear,
                'rpm': round(rpm),
                'speed': speed_val,
                'surface': surface,
                'classColor': d_meta.get('CarClassColor', '3b82f6'),
                'className': d_meta.get('CarClassShortName', ''),
                'classId': d_meta.get('CarClassID', 0),
                'carPath': d_meta.get('CarPath', ''),
                'f2Time': f2,
                'isPlayer': (idx == player_car_idx)
            }

        self.prev_time = now

        # Target Car Metadata & Telemetry
        target_meta = drivers_by_idx.get(target_car_idx, {})
        target_name = target_meta.get('UserName', 'Active Driver')
        target_car_num = target_meta.get('CarNumber', '-')

        target_last_lap = car_last_laps[target_car_idx] if target_car_idx < len(car_last_laps) else -1.0
        target_best_lap = car_best_laps[target_car_idx] if target_car_idx < len(car_best_laps) else -1.0
        target_gear = car_gears[target_car_idx] if target_car_idx < len(car_gears) else 0
        target_rpm = car_rpms[target_car_idx] if target_car_idx < len(car_rpms) else 0.0
        target_pos = car_class_pos[target_car_idx] if target_car_idx < len(car_class_pos) and car_class_pos[target_car_idx] > 0 else (car_positions[target_car_idx] if target_car_idx < len(car_positions) else 0)
        target_lap = car_laps[target_car_idx] if target_car_idx < len(car_laps) else 0
        target_prog = car_progress[target_car_idx] if target_car_idx < len(car_progress) else 0.0

        # Calculate Delta to Fastest Lap
        delta = 0.0
        if not is_spectating and self.ir['LapDeltaToBestLap'] is not None:
            delta = round(float(self.ir['LapDeltaToBestLap']), 3)
        elif target_best_lap > 15.0 and target_last_lap > 15.0:
            delta = round(target_last_lap - target_best_lap, 3)

        # Pedals, Speed & Fuel
        if not is_spectating and is_on_track:
            speed = round(float(self.ir['Speed'] or 0.0), 2)
            throttle = int(round((self.ir['Throttle'] or 0.0) * 100))
            brake = int(round((self.ir['Brake'] or 0.0) * 100))
            fuel = round(float(self.ir['FuelLevel'] or 0.0), 2)
            abs_active = bool(self.ir['BrakeABSactive'] or False)
        else:
            # Spectating target car
            target_data = drivers_map.get(str(target_car_idx), {})
            speed = target_data.get('speed', 0.0)
            throttle = 0
            brake = 0
            fuel = 0.0
            abs_active = False

        # Build telemetry payload
        payload = {
            'v': BRIDGE_VERSION,
            'timestamp': now,
            'is_live': True,
            'diag': {
                'status': 'OK',
                'msg': f"Streaming {'Spectating' if is_spectating else 'Driving'} (#{target_car_num} {target_name})"
            },
            'session': {
                'sid': self.ir['SessionNum'] or 0,
                'trackName': track_name,
                'trackId': track_id,
                'trackLength': track_length_m,
                'active': True,
                'is_live': True,
                'session_time': round(float(self.ir['SessionTime'] or 0.0), 1),
                'session_time_remain': round(float(self.ir['SessionTimeRemain'] or 0.0), 1),
                'laps_remaining': self.ir['SessionLapsRemain'] or 0,
                'fuel_level': fuel
            },
            'telemetry': {
                'v': BRIDGE_VERSION,
                'timestamp': now,
                'is_live': True,
                'isSpectating': is_spectating,
                'spectatingCarIdx': target_car_idx,
                'spectatingCarNum': target_car_num,
                'spectatingDriverName': target_name,
                'camCarIdx': cam_car_idx,
                'playerIdx': player_car_idx,
                'driverName': target_name,
                'carNum': target_car_num,
                'speed': speed,
                'gear': target_gear,
                'rpm': round(target_rpm),
                'fuel': fuel,
                'throttle': throttle,
                'brake': brake,
                'abs': abs_active,
                'position': target_pos,
                'lap': target_lap,
                'progress': target_prog,
                'lastLap': target_last_lap,
                'bestLap': target_best_lap,
                'delta': delta,
                'air_temp': round(float(self.ir['AirTemp'] or 20.0), 1),
                'track_temp': round(float(self.ir['TrackTemp'] or 25.0), 1),
                'wind_vel': round(float(self.ir['WindVel'] or 0.0) * 3.6, 1),
                'wind_dir': round(float(self.ir['WindDir'] or 0.0), 2),
                'drivers': drivers_map
            }
        }

        # Send HTTP PUT to Firebase RTDB
        self.send_payload(self.stream_url, payload)

        # Send presence heartbeat every 5 seconds
        if now - self.last_presence_send >= 5.0:
            presence_payload = {
                'name': target_name,
                'carNum': target_car_num,
                'status': 'online',
                'lastActive': int(now * 1000)
            }
            self.send_payload(self.presence_url, presence_payload)
            self.last_presence_send = now

        # Console logging once per second
        if now - self.last_print >= 1.0:
            mode_tag = f"[SPECTATING #{target_car_num}]" if is_spectating else "[DRIVING]"
            delta_str = f"{delta:+.3f}s" if delta != 0.0 else " 0.000s"
            speed_kmh = round(speed * 3.6)
            print(f"\r{mode_tag:18} {target_name[:20]:20} | P{target_pos:<2} | Spd: {speed_kmh:3} km/h | Gear: {target_gear} | Delta: {delta_str}", end="", flush=True)
            self.last_print = now

    def send_payload(self, url, data):
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(data).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='PUT'
            )
            with urllib.request.urlopen(req, timeout=2.0) as res:
                pass
        except Exception as e:
            # Avoid terminal spamming on transient network hiccups
            pass


def main():
    parser = argparse.ArgumentParser(description="GRiD UP Sim Racing - Telemetry & Spectator Bridge")
    parser.add_argument("-k", "--stream-key", default=DEFAULT_STREAM_KEY, help=f"Stream Key GUID (default: {DEFAULT_STREAM_KEY})")
    parser.add_argument("-t", "--team", default=DEFAULT_TEAM, help=f"Team identifier (default: {DEFAULT_TEAM})")
    parser.add_argument("--hz", type=int, default=10, help="Sync update frequency in Hz (default: 10)")

    args = parser.parse_args()

    bridge = TelemetryBridge(stream_key=args.stream_key, team=args.team, hz=args.hz)
    bridge.run()


if __name__ == "__main__":
    main()
