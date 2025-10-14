Add-Type -AssemblyName System.IO.Compression.FileSystem
$jars = Get-ChildItem -Path . -Recurse -Filter *.jar -ErrorAction SilentlyContinue
foreach ($jar in $jars) {
    try {
        $zf = [System.IO.Compression.ZipFile]::OpenRead($jar.FullName)
        foreach ($entry in $zf.Entries) {
            if ($entry.FullName -like "*.class") {
                $stream = $entry.Open()
                $br = New-Object System.IO.BinaryReader($stream)
                $magic = $br.ReadBytes(8)
                $br.Close()
                $stream.Close()
                if ($magic.Length -ge 8) {
                    $major = [System.BitConverter]::ToUInt16($magic,6)
                    if ($major -ge 69) {
                        Write-Output "$($jar.FullName) -> entry $($entry.FullName) -> major $major"
                    }
                }
            }
        }
        $zf.Dispose()
    } catch {
        # ignore
    }
}
Write-Output "Done content scan"
