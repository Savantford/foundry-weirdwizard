function Skip-Packs {
    param(
        [string]$Folder = "packs"
    )

    # 1. Reset tracked files in the folder to HEAD so skip-worktree can be applied
    git restore --source=HEAD --staged --worktree $Folder/

    # 2. Mark all tracked files under the folder as skip-worktree
    git ls-files $Folder | ForEach-Object {
        git update-index --skip-worktree $_
    }

    # 3. Add a local-only ignore pattern for any new files in that folder
    $excludeFile = ".git/info/exclude"
    if (-not (Select-String -Path $excludeFile -Pattern "^$Folder/.*" -Quiet)) {
        Add-Content $excludeFile "$Folder/**"
    }

    Write-Host "Skip-worktree set for tracked files in '$Folder', and new files will be ignored locally."
}
