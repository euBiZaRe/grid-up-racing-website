import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from datetime import datetime, timezone

def main():
    print("Initializing Firebase Admin SDK...")
    cred = credentials.Certificate(r"F:\Grid Up\grid-up-firebase-adminsdk-fbsvc-11d85f59be.json")
    firebase_admin.initialize_app(cred)

    db = firestore.client()

    report_data = {
        "title": "The Glen 2.4: Endurance and Strategy Collide at Watkins Glen",
        "slug": "the-glen-24-endurance-awaits",
        "date": datetime(2026, 6, 11, 12, 0, 0, tzinfo=timezone.utc),
        "author": "GRiD UP Media",
        "bannerUrl": "assets/reports/the-glen-upcoming.png?v=1",
        "summary": "The GRiD UP GT Challenge rolls into the legendary Watkins Glen International for a grueling 2.4-hour multiclass endurance battle, where speed, precision, and heavy traffic will test every team to their limits.",
        "content": """
<p>The high-speed thrill of multiclass endurance racing returns this weekend as the GRiD UP GT Challenge heads to the historic Watkins Glen International. On Saturday, 13th June 2026, the grid will tackle the demanding "2.4 at The Glen"—a 144-minute test of raw pace, traffic management, and steel-nerved team strategy.</p>

<p>Both GT3 and GT4 machinery will share the iconic 3.4-mile road course, setting the stage for non-stop action. From the high-speed Esses to the tight, momentum-breaking Inner Loop, drivers will have to navigate traffic constantly while keeping their vehicles off the unforgiving blue barriers.</p>

<h2>Speed, Danger, and Strategy</h2>

<p>Watkins Glen is famed for its high-speed nature and lack of run-off areas. In a 2.4-hour endurance format, consistency and clean driving are paramount. The GT3 class will look to use their aerodynamic grip to slice through the field, while GT4 competitors will need to monitor their mirrors closely through the Esses and the Boot to allow faster cars past without compromising their own class battle.</p>

<p>With a longer race duration than the season opener, pit stop strategy, driver changes, and tyre management will play an even larger role. Managing tyre wear on the high-load right-hand bends and choosing the optimal fuel window could make or break a team's race. One small error, or an impatient move in traffic, can end a team's weekend in an instant.</p>

<h2>Event Schedule</h2>

<p>All drivers are required to attend the mandatory pre-race briefing to ensure a safe and competitive event. The official timetable for Saturday's action is detailed below:</p>

<blockquote>
    <strong>Practice:</strong> 3:00pm EST<br>
    <strong>Qualifying:</strong> 3:45pm EST<br>
    <strong>Race Start:</strong> 4:00pm EST
</blockquote>

<p>Watkins Glen requires a unique driving rhythm. The key to a competitive lap lies in carrying speed through the uphill Esses and maximizing exit speed out of the Inner Loop. With multiclass traffic continuously disrupting the ideal line, drivers who can adapt their reference points and remain patient in traffic will ultimately rise to the top.</p>

<h2>Follow the Action Live</h2>

<p>The entire event will be broadcasted live with professional commentary by <a href="https://www.youtube.com/@MotormouthBroadcasting" target="_blank" style="color: var(--primary);">MotorMouth Broadcasting</a>. Whether you're supporting a teammate, tracking your favorite driver, or just looking for premium sim racing entertainment, tune in to catch every turn, pass, and pit stop.</p>

<div style="text-align: center; margin-top: 3rem; margin-bottom: 2rem;">
    <a href="https://gridup.online/league-detail?id=gtc-glen-24" target="_blank" class="btn btn-outline" style="min-width: 200px;">Event Details & Registration</a>
</div>
"""
    }

    try:
        reports_ref = db.collection("reports")
        query = reports_ref.where("slug", "==", report_data["slug"]).get()

        if len(query) > 0:
            doc = query[0]
            print(f"Report with slug '{report_data['slug']}' already exists. Updating document ID: {doc.id}")
            reports_ref.document(doc.id).update(report_data)
            print("Successfully updated the report!")
        else:
            print("Inserting new report...")
            doc_ref = reports_ref.add(report_data)
            print(f"Successfully published report! Document ID: {doc_ref[1].id}")

    except Exception as e:
        print(f"Error seeding report: {e}")

if __name__ == "__main__":
    main()
