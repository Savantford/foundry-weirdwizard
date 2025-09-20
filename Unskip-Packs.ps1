function Unskip-Packs {
    param(
        [string]$Folder = "packs"
    )

    git ls-files $Folder | ForEach-Object {
        git update-index --no-skip-worktree $_
    }

    # Optional: remove the local ignore pattern
    $excludeFile = ".git/info/exclude"
    (Get-Content $excludeFile) |
        Where-Object {$_ -notmatch "^$Folder/.*"} |
        Set-Content $excludeFile

    Write-Host "Skip-worktree cleared for '$Folder', and local ignore removed."
}
