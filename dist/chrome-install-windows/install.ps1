$current_location = Get-Location

$current_location = $current_location -replace '\\', '\\'

$locationAlreadySet = Select-String -Path .\key.reg -Pattern $current_location -Quiet

if ($locationAlreadySet) {
    regedit.exe .\key.reg
}
else {
    (Get-Content -Path .\key.reg) -replace 'input', $current_location | Set-Content -Path .\key.reg
    regedit.exe .\key.reg
}