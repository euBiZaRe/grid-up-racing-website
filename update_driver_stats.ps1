
$driversPath = "F:\Grid Up\Website\drivers"

function Get-LicenseClass([string]$sr) {
    switch ($sr[0]) {
        'A' { return 'license-a' }
        'B' { return 'license-b' }
        'C' { return 'license-c' }
        'D' { return 'license-d' }
        default { return 'license-r' }
    }
}

function Get-BarWidth([string]$ir) {
    if ($ir -eq '---') { return '0' }
    $pct = [math]::Round([double]$ir / 5000.0 * 100.0, 1)
    if ($pct -gt 100) { $pct = 100 }
    return "$pct"
}

function Update-DriverFile {
    param(
        [string]$fileName,
        [string]$sc,  [string]$scSR,
        [string]$fm,  [string]$fmSR,
        [string]$ov,  [string]$ovSR,
        [string]$dt,  [string]$dtSR
    )

    $path = Join-Path $driversPath $fileName
    if (-not (Test-Path $path)) {
        Write-Host "NOT FOUND: $fileName" -ForegroundColor Red
        return
    }

    $scClass = Get-LicenseClass $scSR
    $fmClass = Get-LicenseClass $fmSR
    $ovClass = Get-LicenseClass $ovSR
    $dtClass = Get-LicenseClass $dtSR

    $scW = Get-BarWidth $sc
    $fmW = Get-BarWidth $fm
    $ovW = Get-BarWidth $ov
    $dtW = Get-BarWidth $dt

    $content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

    # Replace each rating-group block by category name using regex (singleline mode)
    $opts = [System.Text.RegularExpressions.RegexOptions]::Singleline

    # Sports Car block
    $pattern = '(<div class="rating-group">\s*<div class="rating-label">\s*<span>Sports Car <span class="license-badge )[^"]*("[^>]*>)[^<]*(</span></span>\s*<span>)[^<]*(</span>\s*</div>\s*<div class="rating-bar-bg"><div class="rating-bar-fill" style="width: )[^%]*(%;"></div></div>\s*</div>)'
    $replacement = "`$1$scClass`$2$scSR`$3$sc`$4$scW`$5"
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, $replacement, $opts)

    # Formula block
    $pattern = '(<div class="rating-group">\s*<div class="rating-label">\s*<span>Formula <span class="license-badge )[^"]*("[^>]*>)[^<]*(</span></span>\s*<span>)[^<]*(</span>\s*</div>\s*<div class="rating-bar-bg"><div class="rating-bar-fill" style="width: )[^%]*(%;"></div></div>\s*</div>)'
    $replacement = "`$1$fmClass`$2$fmSR`$3$fm`$4$fmW`$5"
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, $replacement, $opts)

    # Oval block
    $pattern = '(<div class="rating-group">\s*<div class="rating-label">\s*<span>Oval <span class="license-badge )[^"]*("[^>]*>)[^<]*(</span></span>\s*<span>)[^<]*(</span>\s*</div>\s*<div class="rating-bar-bg"><div class="rating-bar-fill" style="width: )[^%]*(%;"></div></div>\s*</div>)'
    $replacement = "`$1$ovClass`$2$ovSR`$3$ov`$4$ovW`$5"
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, $replacement, $opts)

    # Dirt block
    $pattern = '(<div class="rating-group">\s*<div class="rating-label">\s*<span>Dirt <span class="license-badge )[^"]*("[^>]*>)[^<]*(</span></span>\s*<span>)[^<]*(</span>\s*</div>\s*<div class="rating-bar-bg"><div class="rating-bar-fill" style="width: )[^%]*(%;"></div></div>\s*</div>)'
    $replacement = "`$1$dtClass`$2$dtSR`$3$dt`$4$dtW`$5"
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, $replacement, $opts)

    [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
    Write-Host "Updated: $fileName" -ForegroundColor Green
}

# ===== DRIVER DATA (sc=SportsCarIR, scSR=SportsCar SafetyRating, fm=FormulaIR, fmSR=..., ov=OvalIR, dt=DirtIR) =====
# Dirt = DirtOval if it has a real value, else DirtRoad

Update-DriverFile 'alex-cortez.html'          '4125' 'A 4.24' '2989' 'B 2.74' '1972' 'C 4.71' '1350' 'R 2.50'
Update-DriverFile 'aman-johnson.html'          '1184' 'A 4.99' '1184' 'A 4.99' '1350' 'R 2.50' '1350' 'R 2.50'
Update-DriverFile 'andrew-fabian.html'         '2251' 'A 4.99' '2126' 'A 3.55' '2638' 'A 3.05' '1212' 'B 2.67'
Update-DriverFile 'aten-wa-theba.html'         '2107' 'B 2.32' '2555' 'C 3.49' '1662' 'B 3.57' '1367' 'D 2.60'
Update-DriverFile 'bill-mcclain.html'          '1828' 'A 4.95' '1960' 'A 3.96' '1962' 'C 2.81' '1428' 'D 2.43'
Update-DriverFile 'brandon-koch.html'          '2096' 'A 2.62' '1740' 'C 2.60' '1828' 'C 2.36' '1533' 'D 2.57'
Update-DriverFile 'broughton-jones.html'       '595'  'C 1.40' '---'  'R 2.65' '1350' 'R 2.50' '1350' 'R 2.50'
Update-DriverFile 'bud-carmon.html'            '1076' 'A 2.02' '1202' 'C 3.88' '727'  'C 2.35' '1350' 'R 2.50'
Update-DriverFile 'connor-hatfield.html'       '1425' 'A 1.80' '1760' 'B 2.53' '2748' 'A 2.44' '1202' 'B 2.36'
Update-DriverFile 'daniel-tamminga.html'       '1170' 'A 3.58' '1311' 'C 2.06' '1350' 'R 2.50' '1350' 'R 2.50'
Update-DriverFile 'david-shreve.html'          '1902' 'A 1.56' '1743' 'B 2.24' '1337' 'D 2.70' '1325' 'D 2.44'
Update-DriverFile 'faraz-ebrahim.html'         '1036' 'A 4.04' '1350' 'A 3.57' '1331' 'A 3.79' '1350' 'R 2.50'
Update-DriverFile 'gabe-wilmoth.html'          '2040' 'A 4.76' '1440' 'C 2.43' '1277' 'B 2.72' '1079' 'C 2.43'
Update-DriverFile 'isaac-shore.html'           '894'  'B 2.66' '552'  'D 1.18' '1380' 'B 2.01' '1350' 'R 2.50'
Update-DriverFile 'jacob-reid.html'            '3712' 'A 4.99' '1664' 'D 2.95' '1664' 'C 4.99' '---'  'R 2.76'
Update-DriverFile 'jacob-roberts.html'         '1471' 'B 1.53' '1350' 'R 2.50' '1106' 'D 1.23' '1350' 'R 2.50'
Update-DriverFile 'jason-hayden.html'          '1989' 'A 3.34' '1619' 'D 2.56' '---'  'R 2.69' '1464' 'D 3.35'
Update-DriverFile 'john-daniels.html'          '2423' 'A 3.43' '2262' 'A 2.40' '3212' 'A 3.55' '1347' 'D 2.53'
Update-DriverFile 'john-houston.html'          '1832' 'B 2.75' '1068' 'C 2.02' '2123' 'B 2.66' '1350' 'R 2.50'
Update-DriverFile 'johnathan-shampine.html'    '2403' 'B 3.51' '---'  'R 2.65' '2427' 'A 2.62' '1697' 'C 3.36'
Update-DriverFile 'justin-sadowski.html'       '637'  'B 2.68' '807'  'A 3.05' '---'  'R 2.59' '1350' 'R 2.50'
Update-DriverFile 'keith-todd.html'            '956'  'A 3.83' '1043' 'C 4.99' '2597' 'A 2.37' '2218' 'A 2.55'
Update-DriverFile 'landen-hendershot.html'     '1140' 'A 4.23' '1008' 'A 4.67' '2696' 'A 2.23' '1311' 'A 2.68'
Update-DriverFile 'levi-wolfe.html'            '2071' 'A 4.99' '1383' 'C 2.41' '3026' 'A 4.73' '1436' 'D 2.82'
Update-DriverFile 'marko-skrnjug.html'         '1756' 'A 4.93' '1646' 'C 2.97' '1107' 'C 2.10' '---'  'R 2.50'
Update-DriverFile 'matthew-graham-4.html'      '1193' 'A 2.52' '---'  'R 2.99' '1350' 'R 2.50' '1350' 'R 2.50'
Update-DriverFile 'matthew-koch.html'          '2104' 'A 3.06' '1636' 'B 2.67' '1521' 'D 2.67' '1402' 'C 2.78'
Update-DriverFile 'matty-roberts.html'         '1268' 'C 2.07' '1350' 'R 2.50' '---'  'R 2.59' '---'  'R 2.58'
Update-DriverFile 'michael-odell.html'         '3674' 'A 3.71' '3126' 'A 2.35' '2092' 'A 2.47' '1466' 'D 2.69'
Update-DriverFile 'michael-zuver.html'         '1792' 'A 3.91' '1668' 'B 2.04' '2486' 'C 3.77' '1365' 'B 3.09'
Update-DriverFile 'strats-g.html'             '1426' 'C 2.68' '1449' 'D 2.35' '---'  'R 2.16' '---'  'R 2.58'
Update-DriverFile 'tanner-hupp.html'           '937'  'C 2.75' '---'  'R 2.14' '---'  'R 2.46' '1350' 'R 2.50'
Update-DriverFile 'terry-cantwell.html'        '1381' 'A 4.99' '1311' 'D 1.67' '---'  'R 2.73' '2077' 'C 2.72'
Update-DriverFile 'zack-saunders.html'         '2698' 'A 4.50' '2058' 'A 3.39' '3427' 'A 2.98' '1785' 'B 3.70'
Update-DriverFile 'martyn-cook.html'           '2263' 'A 4.99' '2054' 'A 4.99' '1419' 'C 2.83' '---'  'R 2.50'

Write-Host "`nAll done! $((Get-ChildItem $driversPath -Filter *.html | Measure-Object).Count) driver files processed." -ForegroundColor Cyan
