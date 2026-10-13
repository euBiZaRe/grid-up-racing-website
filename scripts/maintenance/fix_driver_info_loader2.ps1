$driversPath = "F:\Grid Up\Website\drivers"

# The old script (matches by driverName field)
$oldScript = @'

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

# New script: uses the claims doc (keyed by driver name) to find the UID, then loads user data
$newScript = @'

    <script>
        // Load driver info via claims -> users lookup (auto-populates for claimed profiles)
        (function() {
            const driverName = document.querySelector('h1.glow-text')
                ? document.querySelector('h1.glow-text').textContent.trim()
                : null;
            if (!driverName) return;

            function tryLoadDriverInfo() {
                if (typeof db === 'undefined' || db === null) {
                    setTimeout(tryLoadDriverInfo, 200);
                    return;
                }
                // Step 1: Look up the claim doc by driver name (doc ID = driver name)
                db.collection('claims').doc(driverName).get()
                    .then(function(claimDoc) {
                        if (!claimDoc.exists) return;
                        var claimData = claimDoc.data();
                        // Only use verified claims
                        if (claimData.status !== 'verified') return;
                        var uid = claimData.discordId;
                        if (!uid) return;
                        // Step 2: Fetch the user's profile doc using their UID
                        return db.collection('users').doc(uid).get();
                    })
                    .then(function(userDoc) {
                        if (!userDoc || !userDoc.exists) return;
                        var d = userDoc.data();
                        var age    = document.getElementById('di-age');
                        var cntry  = document.getElementById('di-country');
                        var car    = document.getElementById('di-fav-car');
                        var track  = document.getElementById('di-fav-track');
                        var advice = document.getElementById('di-advice');
                        if (age   && d.age)      age.textContent    = d.age;
                        if (cntry && d.country)  cntry.textContent  = d.country;
                        if (car   && d.favCar)   car.textContent    = d.favCar;
                        if (track && d.favTrack) track.textContent  = d.favTrack;
                        if (advice && d.advice)  advice.textContent = '\u201c' + d.advice + '\u201d';
                    })
                    .catch(function(e) { console.warn('Driver info load failed:', e); });
            }
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
