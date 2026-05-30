$driversPath = "F:\Grid Up\Website\drivers"
$files = Get-ChildItem -Path $driversPath -Filter "*.html"
$updated = 0
foreach ($f in $files) {
    $c = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $old = 'Official GRiD UP Driver | Member since N/A'
    $new = 'Official GRiD UP Driver'
    if ($c.Contains($old)) {
        $c = $c.Replace($old, $new)
        [System.IO.File]::WriteAllText($f.FullName, $c, [System.Text.Encoding]::UTF8)
        $updated++
        Write-Host "Updated: $($f.Name)" -ForegroundColor Green
    }
}
Write-Host "Done! Updated $updated files." -ForegroundColor Cyan
