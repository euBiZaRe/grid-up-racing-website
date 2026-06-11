import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone

def main():
    print("Initializing Firebase Admin SDK...")
    cred = credentials.Certificate(r"F:\Grid Up\grid-up-firebase-adminsdk-fbsvc-11d85f59be.json")
    firebase_admin.initialize_app(cred)

    db = firestore.client()
    event_id = "gtc-glen-24"
    regs_ref = db.collection("leagues").document(event_id).collection("registrations")

    regs_data = [
        # GT3 Class - Teams (2+ drivers)
        {
            "teamName": "Team Wynn's",
            "name": "Martyn Cook",
            "coDrivers": "Matty Roberts",
            "car": "",
            "entryType": "team",
            "status": "confirmed"
        },
        {
            "teamName": "Dream Team",
            "name": "Gabe Wilmoth",
            "coDrivers": "Terry Cantwell",
            "car": "",
            "entryType": "team",
            "status": "confirmed"
        },
        {
            "teamName": "Depend® for Men Motorsports",
            "name": "Levi Wolfe",
            "coDrivers": "Marko Skrnjug",
            "car": "",
            "entryType": "team",
            "status": "confirmed"
        },
        {
            "teamName": "\"Juan\"",
            "name": "Erskine Jones",
            "coDrivers": "Michael O'Dell",
            "car": "",
            "entryType": "team",
            "status": "confirmed"
        },
        {
            "teamName": "F&F Racing",
            "name": "Faraz Ebrahim",
            "coDrivers": "Alexander Cortez",
            "car": "",
            "entryType": "team",
            "status": "confirmed"
        },
        {
            "teamName": "Koch Motorsports",
            "name": "Matthew Koch",
            "coDrivers": "Brandon Koch",
            "car": "",
            "entryType": "team",
            "status": "confirmed"
        },
        # GT3 Class - Solo (1 driver)
        {
            "name": "Jacob Reid",
            "car": "",
            "entryType": "solo",
            "status": "confirmed"
        },
        {
            "name": "Joseph Francis5",
            "car": "",
            "entryType": "solo",
            "status": "confirmed"
        },

        # GT4 Class - Teams (2+ drivers)
        {
            "teamName": "Angry Rooster Racing",
            "name": "Andrew B Fabian",
            "coDrivers": "Landen Hendershot",
            "car": "",
            "entryType": "team",
            "status": "confirmed"
        },
        {
            "teamName": "Grumpy Duck Racing",
            "name": "Adam L Jones",
            "coDrivers": "Zack Saunders",
            "car": "",
            "entryType": "team",
            "status": "confirmed"
        },
        {
            "teamName": "Apex Racing",
            "name": "David Shreve",
            "coDrivers": "Mark Prince",
            "car": "",
            "entryType": "team",
            "status": "confirmed"
        },
        # GT4 Class - Solo (1 driver)
        {
            "name": "Johnathan Shampine",
            "car": "",
            "entryType": "solo",
            "status": "confirmed"
        },
        {
            "name": "Matt Perez",
            "car": "",
            "entryType": "solo",
            "status": "confirmed"
        },
        {
            "name": "Tanner Hupp",
            "car": "",
            "entryType": "solo",
            "status": "confirmed"
        },
        {
            "name": "A.J. Johnson",
            "car": "",
            "entryType": "solo",
            "status": "confirmed"
        }
    ]

    try:
        print("Clearing existing registrations for gtc-glen-24...")
        existing_docs = regs_ref.get()
        batch = db.batch()
        for doc in existing_docs:
            batch.delete(regs_ref.document(doc.id))
        if len(existing_docs) > 0:
            batch.commit()
            print(f"Deleted {len(existing_docs)} old registrations.")
        else:
            print("No old registrations found.")

        print("Writing new registrations...")
        batch = db.batch()
        now = datetime.now(timezone.utc)
        for i, reg in enumerate(regs_data):
            doc_id = f"entry_{i}"
            reg["avatar"] = ""
            reg["timestamp"] = now
            doc_ref = regs_ref.document(doc_id)
            batch.set(doc_ref, reg)
            name_display = reg["teamName"] if reg["entryType"] == "team" else reg["name"]
            print(f"Prepared {doc_id}: {name_display} [{reg['entryType']}]")
        
        batch.commit()
        print("\nSUCCESS! Successfully seeded registrations for gtc-glen-24.")

    except Exception as e:
        print(f"Error seeding registrations: {e}")

if __name__ == "__main__":
    main()
