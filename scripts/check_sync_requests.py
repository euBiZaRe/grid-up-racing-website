import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os
import sys
import json

def check_requests():
    # Use service account from environment variable
    sa_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
    if not sa_json:
        print("Error: FIREBASE_SERVICE_ACCOUNT environment variable not set.")
        sys.exit(1)
        
    try:
        cred_dict = json.loads(sa_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        sys.exit(1)
        
    db = firestore.client()
    
    # Check for profiles sync request
    workflow_id = sys.argv[1] if len(sys.argv) > 1 else 'update-profiles.yml'
    
    doc_ref = db.collection("sync_requests").doc(workflow_id)
    doc = doc_ref.get()
    
    if doc.exists:
        data = doc.to_dict()
        if data.get('status') == 'pending':
            print(f"Found pending request for {workflow_id}. Starting sync...")
            doc_ref.update({'status': 'running', 'startedAt': firestore.SERVER_TIMESTAMP})
            return True # Signal to continue
            
    # If it's a scheduled run, we might want to run anyway. 
    # But for manual triggers, we return false if no request.
    is_scheduled = os.environ.get('GITHUB_EVENT_NAME') == 'schedule'
    if is_scheduled:
        print("Scheduled run detected. Continuing sync...")
        return True
        
    print(f"No pending request for {workflow_id}. Skipping.")
    return False

if __name__ == "__main__":
    if check_requests():
        sys.exit(0)
    else:
        sys.exit(1)
