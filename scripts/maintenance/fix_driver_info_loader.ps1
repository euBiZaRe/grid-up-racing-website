$driversPath = "F:\Grid Up\Website\drivers"

# The old broken loader script
$oldScript = @'

    <script>
        // Load driver info from Firestore
        (function() {
            const driverName = document.querySelector('h1.glow-text') 
                ? document.querySelector('h1.glow-text').textContent.trim() 
                : null;
            if (!driverName) return;

            function tryLoadDriverInfo() {
                if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
                    setTimeout(tryLoadDriverInfo, 300);
                    return;
                }
                const db = firebase.firestore();
                db.collection('users')
                    .where('driverName', '==', driverName)
                    .limit(1)
                    .get()
                    .then(function(snap) {
                        if (snap.empty) return;
                        const d = snap.docs[0].data();
                        if (d.age)      document.getElementById('di-age').textContent = d.age;
                        if (d.country)  document.getElementById('di-country').textContent = d.country;
                        if (d.favCar)   document.getElementById('di-fav-car').textContent = d.favCar;
                        if (d.favTrack) document.getElementById('di-fav-track').textContent = d.favTrack;
                        if (d.advice)   document.getElementById('di-advice').textContent = '"' + d.advice + '"';
                    })
                    .catch(function(e) { console.warn('Driver info load failed:', e); });
            }
            tryLoadDriverInfo();
        })();
    </script>
'@

# The new fixed loader — uses the global `db` var created by auth.js, waits for it properly
$newScript = @'

    <script>
        // Load driver info from Firestore (uses db from auth.js)
        (function() {
            const driverName = document.querySelector('h1.glow-text') 
                ? document.querySelector('h1.glow-text').textContent.trim() 
                : null;
            if (!driverName) return;

            function tryLoadDriverInfo() {
                // Wait for auth.js to initialise the global `db` variable
                if (typeof db === 'undefined' || db === null) {
                    setTimeout(tryLoadDriverInfo, 200);
                    return;
                }
                db.collection('users')
                    .where('driverName', '==', driverName)
                    .limit(1)
                    .get()
                    .then(function(snap) {
                        if (snap.empty) return;
                        const d = snap.docs[0].data();
                        var age   = document.getElementById('di-age');
                        var cntry = document.getElementById('di-country');
                        var car   = document.getElementById('di-fav-car');
                        var track = document.getElementById('di-fav-track');
                        var advice = document.getElementById('di-advice');
                        if (age   && d.age)      age.textContent   = d.age;
                        if (cntry && d.country)  cntry.textContent = d.country;
                        if (car   && d.favCar)   car.textContent   = d.favCar;
                        if (track && d.favTrack) track.textContent = d.favTrack;
                        if (advice && d.advice)  advice.textContent = '\u201c' + d.advice + '\u201d';
                    })
                    .catch(function(e) { console.warn('Driver info load failed:', e); });
            }
            // Give auth.js a moment to run first, then start polling for db
            setTimeout(tryLoadDriverInfo, 100);
        })();
    </script>
'@

$files = Get-ChildItem -Path $driversPath -Filter "*.html" | Where-Object { $_.Name -ne "driver-template.html" }

$updated = 0
$skipped = 0
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)

    if ($content.Contains($oldScript)) {
        $content = $content.Replace($oldScript, $newScript)
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Updated: $($file.Name)" -ForegroundColor Green
        $updated++
    } else {
        Write-Host "Skipped (old script not found): $($file.Name)" -ForegroundColor Yellow
        $skipped++
    }
}

Write-Host ""
Write-Host "Done! Updated: $updated, Skipped: $skipped" -ForegroundColor Cyan
