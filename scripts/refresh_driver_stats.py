import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

import sync_garage61
import update_iracing_ratings

if __name__ == "__main__":
    sync_garage61.sync()
    update_iracing_ratings.main()
