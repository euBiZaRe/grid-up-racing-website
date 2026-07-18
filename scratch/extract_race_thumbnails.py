import os
import subprocess

VIDEO_PATH = r"C:\Users\Mattys PC\Downloads\Road America Gets Two Hours of GT Trouble ¦ Elkhart Lake 120 ¦ GRID UP\Road America Gets Two Hours of GT Trouble ¦ Elkhart Lake 120 ¦ GRID UP (1080p_60fps_H264-128kbit_AAC).mp4"
OUTPUT_DIR = r"C:\Users\Mattys PC\.gemini\antigravity\brain\c1d9a572-4c2b-4849-b5f0-9e4b6beb049a\scratch\thumbnails"

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    # We will extract a frame every 240 seconds (4 minutes)
    # Total duration is 9853 seconds (approx 41 frames)
    interval = 240
    total_duration = 9853
    
    print(f"Extracting thumbnails every {interval} seconds...")
    for sec in range(0, total_duration, interval):
        minute = sec // 60
        filename = f"frame_{minute:03d}m.jpg"
        out_path = os.path.join(OUTPUT_DIR, filename)
        
        # Scale to 640x360 to save disk space and make loading fast
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(sec),
            "-i", VIDEO_PATH,
            "-vframes", "1",
            "-vf", "scale=640:360",
            out_path
        ]
        try:
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            print(f"Extracted {filename}")
        except Exception as e:
            print(f"Error at {sec}s: {e}")

if __name__ == "__main__":
    main()
