$driversPath = "F:\Grid Up\Website\drivers"

# The old static Driver Information block (no IDs on the value divs)
$oldBlock = @'
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                        <div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #fff;">N/A</div>
                            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); margin-top: 0.5rem;">Age</div>
                        </div>
                        <div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #fff;">N/A</div>
                            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); margin-top: 0.5rem;">Country</div>
                        </div>
                        <div style="grid-column: span 2;">
                            <div style="font-size: 1.2rem; font-weight: 500; color: #fff;">N/A</div>
                            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); margin-top: 0.5rem;">Favourite Car (In iRacing)</div>
                        </div>
                        <div style="grid-column: span 2;">
                            <div style="font-size: 1.2rem; font-weight: 500; color: #fff;">N/A</div>
                            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); margin-top: 0.5rem;">Favourite Track</div>
                        </div>
                        <div style="grid-column: span 2;">
                            <div style="font-size: 1rem; line-height: 1.6; color: rgba(255,255,255,0.9); font-style: italic;">"N/A"</div>
                            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); margin-top: 0.5rem;">Advice for New Sim Racers</div>
                        </div>
                    </div>
'@

# The new block with IDs on value divs
$newBlock = @'
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                        <div>
                            <div id="di-age" style="font-size: 1.5rem; font-weight: 700; color: #fff;">N/A</div>
                            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); margin-top: 0.5rem;">Age</div>
                        </div>
                        <div>
                            <div id="di-country" style="font-size: 1.5rem; font-weight: 700; color: #fff;">N/A</div>
                            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); margin-top: 0.5rem;">Country</div>
                        </div>
                        <div style="grid-column: span 2;">
                            <div id="di-fav-car" style="font-size: 1.2rem; font-weight: 500; color: #fff;">N/A</div>
                            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); margin-top: 0.5rem;">Favourite Car (In iRacing)</div>
                        </div>
                        <div style="grid-column: span 2;">
                            <div id="di-fav-track" style="font-size: 1.2rem; font-weight: 500; color: #fff;">N/A</div>
                            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); margin-top: 0.5rem;">Favourite Track</div>
                        </div>
                        <div style="grid-column: span 2;">
                            <div id="di-advice" style="font-size: 1rem; line-height: 1.6; color: rgba(255,255,255,0.9); font-style: italic;">"N/A"</div>
                            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); margin-top: 0.5rem;">Advice for New Sim Racers</div>
                        </div>
                    </div>
'@

# The Firestore loader script to inject before </body>
$loaderScript = @'

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

$files = Get-ChildItem -Path $driversPath -Filter "*.html" | Where-Object { $_.Name -ne "driver-template.html" }

$updated = 0
$skipped = 0
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)

    # Step 1: Replace old block with new block (add IDs)
    if ($content.Contains($oldBlock)) {
        $content = $content.Replace($oldBlock, $newBlock)
    }

    # Step 2: Inject loader script before </body> if not already there
    if (-not $content.Contains('di-age')) {
        Write-Host "Skipped (no di block): $($file.Name)" -ForegroundColor Yellow
        $skipped++
        continue
    }

    if (-not $content.Contains('tryLoadDriverInfo')) {
        $content = $content.Replace('</body>', $loaderScript + "`r`n</body>")
    }

    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
    Write-Host "Updated: $($file.Name)" -ForegroundColor Green
    $updated++
}

Write-Host ""
Write-Host "Done! Updated: $updated, Skipped: $skipped" -ForegroundColor Cyan
