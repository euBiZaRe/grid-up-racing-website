// Migration script to move UPCOMING_EVENTS from code to Firestore
const firebase = require('firebase-admin');
const serviceAccount = require('C:/Users/Mattys PC/Downloads/grid-up-firebase-adminsdk.json'); // I'll check if this exists or use a temporary approach

// Since I don't have the service account key locally, I'll recommend the user to run a snippet in the console, 
// OR I can try to find if there's an existing one.
// Actually, I can't run Node.js with firebase-admin without the key.
// Better approach: I'll create a small HTML file with the migration logic that the user can open once, 
// or I'll just write the code into a temporary file and tell the user to run it in the browser console.

const IMSA_SLOTS = [
    '#1: Friday 22:00 GMT (6:00PM EDT)', 
    '#2: Saturday 7:00 GMT (3:00AM EDT)', 
    '#3: Saturday 12:00 GMT (8:00AM EDT)', 
    '#4: Saturday 16:00 GMT (12:00PM EDT)'
];

const UPCOMING_EVENTS = [
    { id: 'imsa-classic-500', name: 'IMSA Classic 500', date: 'April 10-11', startDate: '2026-04-10T22:00:00Z', slots: IMSA_SLOTS, classes: ['GTP', 'LMP2', 'GT3'] },
    { id: 'nurburgring-24h', name: 'Nürburgring 24h', date: 'May 1-3', startDate: '2026-05-01T22:00:00Z', slots: IMSA_SLOTS, classes: ['GT3', 'GT4', 'TCR', 'PC'] },
    { id: 'indy-500', name: 'INDY 500', date: 'May 5-18', startDate: '2026-05-05T18:00:00Z', slots: IMSA_SLOTS, classes: ['IndyCar'] },
    { id: 'world-600', name: 'World 600', date: 'May 20-25', startDate: '2026-05-20T22:00:00Z', slots: IMSA_SLOTS, classes: ['NASCAR Next Gen'] },
    { id: 'thruxton-4h', name: '4 Hours at Thruxton', date: 'May 29-31', startDate: '2026-05-29T22:00:00Z', slots: IMSA_SLOTS, classes: ['GT3', 'LMP3'] },
    { id: 'watkins-glen-6h', name: 'Watkins Glen 6 Hour', date: 'June 19-21', startDate: '2026-06-19T22:00:00Z', slots: IMSA_SLOTS, classes: ['GTP', 'LMP2', 'GT3'] },
    { id: 'firecracker-400', name: 'Firecracker 400', date: 'June 30 - July 6', startDate: '2026-06-30T22:00:00Z', slots: IMSA_SLOTS, classes: ['NASCAR Next Gen'] },
    { id: 'spa-24hr', name: 'Spa 24hr', date: 'July 10-12', startDate: '2026-07-10T22:00:00Z', slots: IMSA_SLOTS, classes: ['GT3'] },
    { id: 'brickyard-400', name: 'Brickyard 400', date: 'July 22-27', startDate: '2026-07-22T22:00:00Z', slots: IMSA_SLOTS, classes: ['NASCAR Next Gen'] },
    { id: 'road-america-6h', name: 'Road America 6h', date: 'July 24-26', startDate: '2026-07-24T22:00:00Z', slots: IMSA_SLOTS, classes: ['GTP', 'LMP2', 'GT3'] },
    { id: 'suzuka-1000km', name: 'Suzuka 1000km', date: 'Sept 10-15', startDate: '2026-09-10T22:00:00Z', slots: IMSA_SLOTS, classes: ['GT3'] },
    { id: 'petit-le-mans', name: 'Petit Le Mans', date: 'Sept 25-27', startDate: '2026-09-25T22:00:00Z', slots: IMSA_SLOTS, classes: ['GTP', 'LMP2', 'GT3'] },
    { id: 'bathurst-1000', name: 'Bathurst 1000', date: 'Oct 2-4', startDate: '2026-10-02T22:00:00Z', slots: IMSA_SLOTS, classes: ['V8 Supercar'] },
    { id: 'indy-8h', name: 'Indy 8h', date: 'Oct 16-18', startDate: '2026-10-16T22:00:00Z', slots: IMSA_SLOTS, classes: ['GT3'] }
];

async function migrate() {
    console.log("Starting migration...");
    const db = firebase.firestore();
    const batch = db.batch();
    
    // We'll store them in settings/event_config as an array for easy atomic updates, 
    // or as separate documents in settings/events/instances.
    // Let's use separate documents in a collection for better scalability.
    const collection = db.collection("events");
    
    for (const event of UPCOMING_EVENTS) {
        batch.set(collection.doc(event.id), event);
    }
    
    await batch.commit();
    console.log("Migration complete!");
}
