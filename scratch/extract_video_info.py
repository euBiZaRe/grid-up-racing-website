import os
import subprocess
import numpy as np
from PIL import Image
import winrt.Windows.Media.Ocr as ocr
import winrt.Windows.Storage.Streams as streams
import asyncio

# Target timestamps in seconds for the 2-hour video
# 10m (600s), 30m (1800s), 60m (3600s), 80m (4800s), 100m (6000s), 110m (6600s), 115m (6900s)
TIMESTAMPS = {
    "early": 600,
    "mid1": 1800,
    "mid2": 3600,
    "late1": 4800,
    "late2": 6000,
    "late3": 6600,
    "end": 6900
}

VIDEO_PATH = r"C:\Users\Mattys PC\Downloads\Road America Gets Two Hours of GT Trouble ¦ Elkhart Lake 120 ¦ GRID UP\Road America Gets Two Hours of GT Trouble ¦ Elkhart Lake 120 ¦ GRID UP (1080p_60fps_H264-128kbit_AAC).mp4"

async def run_ocr(image_path):
    # Load image and perform OCR using Windows Media OCR
    try:
        # Open using PIL, convert to bytes
        img = Image.open(image_path).convert("RGBA")
        width, height = img.size
        
        # We only need the leaderboard area (typically top-left or left side)
        # Let's crop the left 30% of the image to speed up and focus OCR
        crop_w = int(width * 0.35)
        cropped_img = img.crop((0, 0, crop_w, height))
        
        # Save cropped temp image
        cropped_path = image_path.replace(".png", "_crop.png")
        cropped_img.save(cropped_path)
        
        # Convert to Windows SoftwareBitmap
        with open(cropped_path, "rb") as f:
            bytes_data = f.read()
            
        # Create a InMemoryRandomAccessStream
        stream = streams.InMemoryRandomAccessStream()
        writer = streams.DataWriter(stream.get_output_stream_at(0))
        writer.write_bytes(bytes_data)
        await writer.store_async()
        
        # Decode using Windows Graphics Imaging
        from winrt.Windows.Graphics.Imaging import BitmapDecoder
        decoder = await BitmapDecoder.create_async(stream)
        bitmap = await decoder.get_software_bitmap_async()
        
        # Run OCR
        engine = ocr.OcrEngine.try_create_from_user_profile_languages()
        ocr_result = await engine.recognize_async(bitmap)
        
        # Clean up temp crop
        if os.path.exists(cropped_path):
            os.remove(cropped_path)
            
        return ocr_result.text
    except Exception as e:
        return f"OCR Error: {e}"

def extract_frame(seconds, output_path):
    # Use ffmpeg to extract a single frame at the given timestamp
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(seconds),
        "-i", VIDEO_PATH,
        "-vframes", "1",
        output_path
    ]
    try:
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return True
    except Exception as e:
        print(f"Error extracting frame at {seconds}s: {e}")
        return False

async def main():
    print("Starting video analysis...")
    if not os.path.exists("frames"):
        os.makedirs("frames")
        
    for name, secs in TIMESTAMPS.items():
        out_path = f"frames/frame_{name}.png"
        print(f"Extracting frame for {name} ({secs}s)...")
        if extract_frame(secs, out_path):
            print(f"Running OCR on frame {name}...")
            text = await run_ocr(out_path)
            print(f"--- OCR RESULT FOR {name.upper()} ({secs}s) ---")
            print(text)
            print("="*60)
            
            # Clean up extracted frame to save disk space
            if os.path.exists(out_path):
                os.remove(out_path)

if __name__ == "__main__":
    asyncio.run(main())
