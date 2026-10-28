import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os
import sys
import json

def check_requests():
    workflow_id = sys.argv[1] if len(sys.argv) > 1 else 'update-profiles.yml'
    event_name = os.environ.get('GITHUB_EVENT_NAME', '')
    is_scheduled_or_manual = event_name in ('schedule', 'workflow_dispatch', '')

    # Use service account from environment variable if available
    sa_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
    if sa_json:
        try:
            cred_dict = json.loads(sa_json)
            cred = credentials.Certificate(cred_dict)
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
            db = firestore.client()
            doc_ref = db.collection("sync_requests").document(workflow_id)
            doc = doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                if data.get('status') == 'pending':
                    print(f"Found pending request for {workflow_id}. Starting sync...")
                    doc_ref.update({'status': 'running', 'startedAt': firestore.SERVER_TIMESTAMP})
                    return True
        except Exception as e:
            print(f"Warning initializing Firebase Admin SDK: {e}")

    if is_scheduled_or_manual:
        print(f"Event '{event_name or 'local'}' detected. Continuing sync...")
        return True

    print(f"No pending request for {workflow_id}. Skipping.")
    return False

if __name__ == "__main__":
    if check_requests():
        sys.exit(0)
    else:
        sys.exit(1)

