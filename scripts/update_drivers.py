import os
import sys

# Ensure scripts directory is on path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

import sync_garage61
import update_iracing_ratings

def update_profiles():
    print("=== Running Unified Driver Profile & Telemetry Sync ===")
    try:
        sync_garage61.sync()
    except Exception as e:
        print(f"[WARN] sync_garage61 encountered an error: {e}")

    try:
        update_iracing_ratings.main()
    except Exception as e:
        print(f"[WARN] update_iracing_ratings encountered an error: {e}")

if __name__ == "__main__":
    update_profiles()
