$driversPath = "F:\Grid Up\Website\drivers"

function Update-DriverInfoSection {
    $files = Get-ChildItem -Path $driversPath -Filter "*.html"
    
    $replacement = @"
            <!-- Driver Information Section -->
            <div class="glass stat-card" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <h3 class="section-title" style="margin-bottom: 2.5rem;">Driver Information</h3>
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
                </div>
                
"@

    $startMarker = "<!-- Career Stats Section -->"
    $endMarker = "<div style=`"margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1);`">"

    foreach ($file in $files) {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        
        $startIndex = $content.IndexOf($startMarker)
        $endIndex = $content.IndexOf($endMarker, $startIndex)
        
        if ($startIndex -ge 0 -and $endIndex -gt $startIndex) {
            $prefix = $content.Substring(0, $startIndex)
            $suffix = $content.Substring($endIndex)
            $newContent = $prefix + $replacement + $suffix
            
            [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
            Write-Host "Updated: $($file.Name)" -ForegroundColor Green
        } else {
            Write-Host "Skipped (Markers not found): $($file.Name)" -ForegroundColor Yellow
        }
    }
}

Update-DriverInfoSection
Write-Host "Done!" -ForegroundColor Cyan
