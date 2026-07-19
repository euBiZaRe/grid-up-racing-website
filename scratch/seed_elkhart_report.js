const firebase = require("firebase/compat/app");
require("firebase/compat/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyAomPdMD_IrBw52m0Nc2l-cuDKNmH_qqAk",
    authDomain: "grid-up.firebaseapp.com",
    projectId: "grid-up",
    storageBucket: "grid-up.firebasestorage.app",
    messagingSenderId: "649006432736",
    appId: "1:649006432736:web:5220f500a5e53cb7276b85",
    measurementId: "G-956CFQ680Q"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const REPORT_DATA = {
    title: "Two Hours of GT Trouble: Holliday and Poussi Triumph at Road America",
    slug: "elkhart-lake-120-recap",
    date: firebase.firestore.Timestamp.fromDate(new Date("2026-07-19T10:00:00Z")),
    author: "GRiD UP Media",
    bannerUrl: "https://gridup.online/assets/reports/elkhart-lake-banner.jpg?v=2",
    summary: "Road America played host to a chaotic and drama-filled two hours of multiclass racing, where Harrison Holliday survived the GT3 class chaos to claim victory and Pierre Poussi conquered the GT4 class.",
    content: `
<p>The high-speed sweeps and heavy braking zones of Road America played host to a motorsport spectacle on Saturday as the GRiD UP GT Challenge tackled the Elkhart Lake 120. In a grueling 2-hour multiclass battle, drivers had to contend with changing track dynamics, traffic congestion, and highly competitive fields. When the chequered flag finally fell, it was Harrison Holliday who took a dramatic GT3 victory, while Pierre Poussi put on a clinic in the GT4 class to take a commanding win.</p>

<p>Road America's legendary combination of high-speed sweeps and unforgiving walls meant that survival was just as critical as outright speed. With 56 laps completed in the GT3 class and 51 in GT4, the race saw intense strategizing, heavy tyre degradation, and several hard-fought battles through iconic sections like the Carousel, the Kink, and Canada Corner.</p>

<div style="display: flex; gap: 1rem; margin: 2rem 0; justify-content: center; flex-wrap: wrap;">
  <div style="flex: 1; min-width: 280px; text-align: center;">
    <img src="https://gridup.online/assets/reports/elkhart-lake-gt3-start.jpg?v=2" alt="GT3 Field Starts" style="max-width: 100%; border-radius: 8px; border: 1px solid var(--glass-border); box-shadow: 0 4px 20px rgba(0,0,0,0.5); margin: 0;">
  </div>
  <div style="flex: 1; min-width: 280px; text-align: center;">
    <img src="https://gridup.online/assets/reports/elkhart-lake-gt4-start.jpg?v=2" alt="GT4 Field Starts" style="max-width: 100%; border-radius: 8px; border: 1px solid var(--glass-border); box-shadow: 0 4px 20px rgba(0,0,0,0.5); margin: 0;">
  </div>
</div>
<p style="text-align: center; font-size: 0.85rem; color: var(--text-muted); margin-top: -1rem; margin-bottom: 2rem;">The multi-class packs take the green flag.</p>

<h2>GT3: Holliday Survives Attrition to Claim Victory</h2>

<p>The GT3 class was defined by a tactical war of attrition and a frantic final stint. Michael O'Dell of team <i>juan</i> started from pole position and dominated early on, leading a race-high 34 laps. However, Harrison Holliday of Bite Point Racing | B mounted a late-race charge. Slicing through traffic and maintaining optimal tyre wear, Holliday closed the gap and ultimately claimed the lead, holding it for 10 laps to take the chequered flag by 25.132 seconds over O'Dell.</p>

<div style="text-align: center; margin: 2rem 0;">
  <img src="https://gridup.online/assets/reports/elkhart-lake-gt3-battle.jpg?v=2" alt="Harrison Holliday and Michael O'Dell GT3 Battle" style="max-width: 100%; border-radius: 8px; border: 1px solid var(--glass-border); box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
  <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">Harrison Holliday (#921) and Michael O'Dell (#56) fighting bumper-to-bumper for the GT3 class lead.</p>
</div>

<p>Damijan Horvatin of Tekkart Motorsport #306 claimed the final spot on the podium in third, finishing +1:01.030 behind the leader. Alexander Cortez and Matty Roberts of F&F Racing put in a stellar drive to earn Hard Charger honors, recovering from a P14 qualifying position to finish fourth and setting the fastest lap of the race with a blisteringly fast 2:02.975.</p>

<p>Levi Wolfe of Depend for Men Motorsports rounded out the top five, putting in an extremely clean run to finish with only 5 incidents and claim the fewest incidents bonus points.</p>

<p>The race was not kind to everyone, however. High attrition saw several front-runners drop out, with Kevin Miller (Savage Motorsports), Javi Sierra (Sierra Motorsports), Alex Claudio (BWE Racing-#280), Anthony Savignano III (Pocket Aces Motorsports), and the Syndicate Racing duo of Connor Sterghos and Faraz Ebrahim all forced to retire early.</p>

<h3>GT3 Official Results</h3>
<table class="results-table" style="width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.9rem; border: 1px solid var(--glass-border);">
  <thead>
    <tr style="background: rgba(14,165,233,0.1); border-bottom: 1px solid var(--glass-border); text-align: left;">
      <th style="padding: 0.75rem;">Pos</th>
      <th style="padding: 0.75rem;">Driver</th>
      <th style="padding: 0.75rem;">Team / Sponsor</th>
      <th style="padding: 0.75rem;">Gap</th>
      <th style="padding: 0.75rem;">Incidents</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">1</td>
      <td style="padding: 0.75rem; color: #fff; font-weight: 600;">Harrison Holliday</td>
      <td style="padding: 0.75rem;">Bite Point Racing | B</td>
      <td style="padding: 0.75rem; color: var(--primary);">Leader</td>
      <td style="padding: 0.75rem;">15 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">2</td>
      <td style="padding: 0.75rem; color: #fff; font-weight: 600;">Michael O'Dell</td>
      <td style="padding: 0.75rem;">juan</td>
      <td style="padding: 0.75rem;">+25.132</td>
      <td style="padding: 0.75rem;">16 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">3</td>
      <td style="padding: 0.75rem; color: #fff; font-weight: 600;">Damijan Horvatin</td>
      <td style="padding: 0.75rem;">Tekkart Motorsport #306</td>
      <td style="padding: 0.75rem;">+1:01.030</td>
      <td style="padding: 0.75rem;">28 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">4</td>
      <td style="padding: 0.75rem; color: #fff; font-weight: 600;">A. Cortez / M. Roberts</td>
      <td style="padding: 0.75rem;">F&F Racing</td>
      <td style="padding: 0.75rem;">+1:11.415</td>
      <td style="padding: 0.75rem;">19 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">5</td>
      <td style="padding: 0.75rem; color: #fff; font-weight: 600;">Levi Wolfe</td>
      <td style="padding: 0.75rem;">Depend for Men Motorsports</td>
      <td style="padding: 0.75rem;">+1:24.913</td>
      <td style="padding: 0.75rem;">5 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">6</td>
      <td style="padding: 0.75rem;">Heath Olinger</td>
      <td style="padding: 0.75rem;">BWE Racing-#346</td>
      <td style="padding: 0.75rem;">+2:35.701</td>
      <td style="padding: 0.75rem;">13 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">7</td>
      <td style="padding: 0.75rem;">Terry Cantwell</td>
      <td style="padding: 0.75rem;">Dream Team</td>
      <td style="padding: 0.75rem;">-1 Lap</td>
      <td style="padding: 0.75rem;">21 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">8</td>
      <td style="padding: 0.75rem;">Martyn Cook</td>
      <td style="padding: 0.75rem;">Team Wynn's</td>
      <td style="padding: 0.75rem;">-1 Lap</td>
      <td style="padding: 0.75rem;">22 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">9</td>
      <td style="padding: 0.75rem;">Jason Holland</td>
      <td style="padding: 0.75rem;">Bite Point Racing - Solo</td>
      <td style="padding: 0.75rem;">-2 Laps</td>
      <td style="padding: 0.75rem;">22 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">DNF</td>
      <td style="padding: 0.75rem;">Kevin Miller</td>
      <td style="padding: 0.75rem;">Savage Motorsports</td>
      <td style="padding: 0.75rem;">DNF</td>
      <td style="padding: 0.75rem;">10 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">DNF</td>
      <td style="padding: 0.75rem;">Javi Sierra</td>
      <td style="padding: 0.75rem;">Sierra Motorsports</td>
      <td style="padding: 0.75rem;">DNF</td>
      <td style="padding: 0.75rem;">12 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">DNF</td>
      <td style="padding: 0.75rem;">Alex Claudio</td>
      <td style="padding: 0.75rem;">BWE Racing-#280</td>
      <td style="padding: 0.75rem;">DNF</td>
      <td style="padding: 0.75rem;">7 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">DNF</td>
      <td style="padding: 0.75rem;">Anthony Savignano III</td>
      <td style="padding: 0.75rem;">Pocket Aces Motorsports</td>
      <td style="padding: 0.75rem;">DNF</td>
      <td style="padding: 0.75rem;">2 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">DNF</td>
      <td style="padding: 0.75rem;">C. Sterghos / F. Ebrahim</td>
      <td style="padding: 0.75rem;">Syndicate Racing</td>
      <td style="padding: 0.75rem; color: var(--text-muted);">DNF</td>
      <td style="padding: 0.75rem;">3 INC</td>
    </tr>
  </tbody>
</table>

<h2>GT4: Pierre Poussi Conquers demand of Road America</h2>

<p>In the transition area of GT4 class, the race was a demonstration of consistency under pressure. Adam L. Jones of Grumpy Duck Racing started from class pole position, but Pierre Poussi of Tekkart Motorsport quickly asserted himself as the class leader. Poussi drove a clean, consistent race to cross the line first in class, finishing 5 laps down on the overall GT3 leader.</p>

<div style="text-align: center; margin: 2rem 0;">
  <img src="https://gridup.online/assets/reports/elkhart-lake-gt4-battle.jpg?v=2" alt="Andrew B. Fabian and Pierre Poussi GT4 Battle" style="max-width: 100%; border-radius: 8px; border: 1px solid var(--glass-border); box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
  <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">Pierre Poussi (#12, black Mustang) and Andrew B. Fabian (#14, white/red Mustang) in a tight battle through turn 1.</p>
</div>

<p>Xavier Williams of Motohaus Black put in a strong performance to finish second in class. Williams started P21 overall but navigated traffic flawlessly to finish on the podium. Apex Racing's David Shreve and Mark Prince secured the final step on the GT4 podium in third.</p>

<p>Andrew B Fabian of Angry Rooster Racing secured fourth in class while setting the fastest lap of the GT4 division with a 2:17.029. A.J. Johnson of Rev Limit Racing put in an incredibly disciplined drive to claim fifth in class with only 9 incidents, earning the fewest incidents bonus points for the GT4 grid.</p>

<h3>GT4 Official Results</h3>
<table class="results-table" style="width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.9rem; border: 1px solid var(--glass-border);">
  <thead>
    <tr style="background: rgba(14,165,233,0.1); border-bottom: 1px solid var(--glass-border); text-align: left;">
      <th style="padding: 0.75rem;">Pos</th>
      <th style="padding: 0.75rem;">Driver</th>
      <th style="padding: 0.75rem;">Team / Sponsor</th>
      <th style="padding: 0.75rem;">Gap</th>
      <th style="padding: 0.75rem;">Incidents</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">1</td>
      <td style="padding: 0.75rem; color: #fff; font-weight: 600;">Pierre Poussi</td>
      <td style="padding: 0.75rem;">Tekkart Motorsport</td>
      <td style="padding: 0.75rem; color: var(--primary);">Leader</td>
      <td style="padding: 0.75rem;">19 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">2</td>
      <td style="padding: 0.75rem; color: #fff; font-weight: 600;">Xavier Williams</td>
      <td style="padding: 0.75rem;">Motohaus Black</td>
      <td style="padding: 0.75rem;">+15.553</td>
      <td style="padding: 0.75rem;">17 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">3</td>
      <td style="padding: 0.75rem; color: #fff; font-weight: 600;">D. Shreve / M. Prince</td>
      <td style="padding: 0.75rem;">Apex Racing</td>
      <td style="padding: 0.75rem;">+21.074</td>
      <td style="padding: 0.75rem;">16 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">4</td>
      <td style="padding: 0.75rem;">Andrew B Fabian</td>
      <td style="padding: 0.75rem;">Angry Rooster Racing</td>
      <td style="padding: 0.75rem;">+29.127</td>
      <td style="padding: 0.75rem;">21 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">5</td>
      <td style="padding: 0.75rem; color: #fff; font-weight: 600;">Adam L. Jones</td>
      <td style="padding: 0.75rem;">Grumpy Duck Racing</td>
      <td style="padding: 0.75rem;">-1 Lap</td>
      <td style="padding: 0.75rem;">16 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">6</td>
      <td style="padding: 0.75rem;">A.J. Johnson</td>
      <td style="padding: 0.75rem;">Rev Limit Racing</td>
      <td style="padding: 0.75rem;">-1 Lap</td>
      <td style="padding: 0.75rem;">9 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">7</td>
      <td style="padding: 0.75rem;">Daniel Tamminga</td>
      <td style="padding: 0.75rem;">Motohaus White</td>
      <td style="padding: 0.75rem;">-3 Laps</td>
      <td style="padding: 0.75rem;">36 INC</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 0.75rem;">DNF</td>
      <td style="padding: 0.75rem;">Brandon N Berg</td>
      <td style="padding: 0.75rem;">Savage Sim Racing - Team Yellow</td>
      <td style="padding: 0.75rem;">DNF</td>
      <td style="padding: 0.75rem;">0 INC</td>
    </tr>
  </tbody>
</table>

<h2>Post-Race Reflections: In the Drivers' Own Words</h2>

<div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 8px; padding: 1.5rem; margin: 2rem 0;">
  
  <h3 style="color: var(--primary); margin-top: 0;">Harrison Holliday (GT3 Winner)</h3>
  <p style="font-style: italic; margin-left: 1rem; border-left: 3px solid var(--primary); padding-left: 1rem; color: #e2e8f0;">
    "By the end, I was not holding it together very well! I pitted, and a lap later the rain started, so I thought I made the worst possible call. But the rain wasn't too bad for a while, so I could build a good gap. I figured the rain wouldn't make the track too wet for another 5 or 10 laps, so if anyone did take wets, they would fall back pretty fast. My teammate took wets extremely early and it didn't turn out well for him, so you could see just how badly you can fall off if you take them too soon."
  </p>

  <h3 style="color: var(--primary); margin-top: 1.5rem;">Michael O'Dell (GT3 Runner-Up)</h3>
  <p style="font-style: italic; margin-left: 1rem; border-left: 3px solid var(--primary); padding-left: 1rem; color: #e2e8f0;">
    "All things considered, I predicted it to go wet a lot sooner, and when it did go wet, it didn't really do enough. Even with doing a 360 out of the Kink and keeping the car rolling forward, it was good. I was hoping for a little bit more rain, but sometimes you call the wrong strategy. I was trying to lift-and-coast to get myself to commit right as the rain started to pick up so that I wouldn't have an extra stop. But the rain got pushed back a little bit and that threw it off. I decided to try to take the safe bet of wets, and the safe bet was not the right one today."
  </p>

  <h3 style="color: var(--primary); margin-top: 1.5rem;">Damijan Horvatin (GT3 P3)</h3>
  <p style="font-style: italic; margin-left: 1rem; border-left: 3px solid var(--primary); padding-left: 1rem; color: #e2e8f0;">
    "I feel good, but I could have felt better. It was a mistake on my part. In the laps leading up to my wreck, I noticed the guy behind (in the Mustang) was really quick through the Kink and gaining all the time. I would get a gap, he would gain it back. The rear just wouldn't stay planted in that corner for me, and in just the wrong decision, I decided to push a little harder to not lose time. I just touched the curb, it spun me around, and that led to all sorts of issues. So it's a bit of a sour taste—I would rather have finished P5 with a clean car instead of crab-walking it for those last few laps. But a debut P3, I'll take it."
  </p>

  <h3 style="color: var(--primary); margin-top: 1.5rem;">Pierre Poussi (GT4 Winner)</h3>
  <p style="font-style: italic; margin-left: 1rem; border-left: 3px solid var(--primary); padding-left: 1rem; color: #e2e8f0;">
    "It was just crazy, man! I went to the wets... about 6 minutes to go I could start picking a little bit of time off, and I saw P1 [Fabian] was losing it, so I was just pushing. I said: if I can get in his mirror, he'll overcook it, and that's exactly what he did. This is our debut [for Tekkart Motorsport]—both Damijan and I are on the podium, let's go!"
  </p>

  <h3 style="color: var(--primary); margin-top: 1.5rem;">Andrew B. Fabian (GT4 P4)</h3>
  <p style="font-style: italic; margin-left: 1rem; border-left: 3px solid var(--primary); padding-left: 1rem; color: #e2e8f0;">
    "Yeah, that's just my typical luck. I'm just very unlucky in races, I can never clench the win, just like Spa. Pierre had insane pace, so I had to do something interesting with my strategy. I was actually pulling in for my final stop with wets selected, and as I'm stopping in the box, I was like: dries, why not? It was just maybe two laps of too much wet at the end. Those final few laps, some of the downhill braking zones were impossible—the car just would not stop. He caught up to me and it is what it is, but he definitely deserved the win. I was just hoping that cheeky strategy would work out. If there was another 30 minutes left, I probably would have stayed on wets, but when I came in it was like 15 minutes left, so it's just not long enough for the track to get soaking wet."
  </p>

</div>
`
};

async function main() {
    try {
        console.log("Checking if report already exists...");
        const reportsRef = db.collection("reports");
        const query = await reportsRef.where("slug", "==", REPORT_DATA.slug).get();
        
        if (!query.empty) {
            const doc = query.docs[0];
            console.log(`Found existing report (ID: ${doc.id}). Updating...`);
            await doc.ref.update(REPORT_DATA);
            console.log("Report updated successfully.");
        } else {
            console.log("Inserting new report...");
            const docRef = await reportsRef.add(REPORT_DATA);
            console.log(`Report published successfully! Document ID: ${docRef.id}`);
        }
    } catch(e) {
        console.error("Error publishing report:", e);
    }
    process.exit(0);
}

main();
