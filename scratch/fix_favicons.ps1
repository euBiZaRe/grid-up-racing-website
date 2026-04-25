$files = Get-ChildItem -Path "F:\Grid Up\Website" -Filter "*.html" -Recurse

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Check if favicon already exists
    if ($content -notmatch 'rel="icon"') {
        Write-Host "Updating $($file.FullName)"
        
        # Calculate relative path to root based on depth
        $depth = ($file.FullName.Replace("F:\Grid Up\Website\", "").Split("\").Count) - 1
        $relPath = ""
        for ($i=0; $i -lt $depth; $i++) { $relPath += "../" }
        $faviconTag = "    <link rel=`"icon`" type=`"image/png`" href=`"$($relPath)assets/logo.png`">"
        
        # Inject before </head> or after existing link tags
        if ($content -match '<link rel="stylesheet".*?>') {
            $content = $content -replace '(<link rel="stylesheet".*?>)', "`$1`n$faviconTag"
        } elseif ($content -match '</head>') {
            $content = $content -replace '</head>', "$faviconTag`n</head>"
        }
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
    }
}
