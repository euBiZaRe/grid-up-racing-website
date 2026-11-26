import os
import subprocess
import sys
import zipfile
import shutil

def build():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, ".."))
    dist_dir = os.path.join(script_dir, "dist")
    build_dir = os.path.join(script_dir, "build")
    entry_point = os.path.join(script_dir, "bridge_logic.py")
    icon_ico = os.path.join(script_dir, "icon.ico")
    icon_png = os.path.join(script_dir, "icon.png")

    cmd = [
        sys.executable,
        "-m", "PyInstaller",
        "--noconfirm",
        "--clean",
        "--onefile",
        "--windowed",
        "--name", "GridUpTelemetryRecorder",
        f"--icon={icon_ico}",
        f"--add-data={icon_ico};.",
        f"--add-data={icon_png};.",
        f"--distpath={dist_dir}",
        f"--workpath={build_dir}",
        "--hidden-import=pystray",
        "--hidden-import=PIL",
        "--hidden-import=PIL.Image",
        "--hidden-import=PIL.ImageDraw",
        "--hidden-import=irsdk",
        "--hidden-import=firebase_admin",
        "--hidden-import=google.cloud.firestore",
        "--hidden-import=google.cloud.storage",
        "--hidden-import=urllib.request",
        "--hidden-import=websockets",
        entry_point
    ]

    print(f"Building GridUpTelemetryRecorder.exe with PyInstaller (--windowed)...")
    res = subprocess.run(cmd, cwd=script_dir)
    if res.returncode != 0:
        print(f"Build failed with code {res.returncode}")
        sys.exit(res.returncode)

    built_exe = os.path.join(dist_dir, "GridUpTelemetryRecorder.exe")
    if not os.path.exists(built_exe):
        print(f"Error: {built_exe} not found!")
        sys.exit(1)

    print(f"Build successful: {built_exe} ({os.path.getsize(built_exe)} bytes)")

    # Copy to downloads/
    downloads_dir = os.path.join(project_root, "downloads")
    os.makedirs(downloads_dir, exist_ok=True)
    target_exe = os.path.join(downloads_dir, "GridUpTelemetryRecorder.exe")
    shutil.copy2(built_exe, target_exe)
    print(f"Copied to {target_exe}")

    # Create downloads/GridUpTelemetryRecorder.zip
    target_zip = os.path.join(downloads_dir, "GridUpTelemetryRecorder.zip")
    with zipfile.ZipFile(target_zip, 'w', zipfile.ZIP_DEFLATED) as z:
        z.write(target_exe, arcname="GridUpTelemetryRecorder.exe")
    print(f"Created archive: {target_zip} ({os.path.getsize(target_zip)} bytes)")

    # Clean up build artifacts
    shutil.rmtree(build_dir, ignore_errors=True)
    shutil.rmtree(dist_dir, ignore_errors=True)
    spec_file = os.path.join(script_dir, "GridUpTelemetryRecorder.spec")
    if os.path.exists(spec_file):
        os.remove(spec_file)

    print("[DONE] Telemetry Recorder built and packaged successfully!")

if __name__ == "__main__":
    build()
