$ErrorActionPreference = 'SilentlyContinue'
$jars = Get-ChildItem -Path . -Recurse -Filter *.jar -ErrorAction SilentlyContinue
foreach ($file in $jars) {
    try {
        $fs = [System.IO.File]::OpenRead($file.FullName)
        $br = New-Object System.IO.BinaryReader($fs)
        $magic = $br.ReadBytes(8)
        $br.Close()
        $fs.Close()
        if ($magic.Length -ge 8) {
            $major = [System.BitConverter]::ToUInt16($magic,6)
            if ($major -ge 69) { Write-Output "$($file.FullName) -> $major" }
        }
    } catch {
        # ignore unreadable files
    }
}
Write-Output "Done scanning jars."
