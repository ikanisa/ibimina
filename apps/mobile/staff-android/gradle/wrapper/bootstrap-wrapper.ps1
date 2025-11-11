param(
    [Parameter(Mandatory = $true)]
    [string]$AppHome
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$wrapperJar = Join-Path -Path $AppHome -ChildPath 'gradle\wrapper\gradle-wrapper.jar'
if (Test-Path -Path $wrapperJar) {
    return
}

$propertiesPath = Join-Path -Path $AppHome -ChildPath 'gradle\wrapper\gradle-wrapper.properties'
if (-not (Test-Path -Path $propertiesPath)) {
    throw 'Missing gradle-wrapper.properties; cannot download wrapper JAR.'
}

Add-Type -AssemblyName System.IO.Compression.FileSystem

$distributionLine = Get-Content -Path $propertiesPath | Where-Object { $_ -match '^distributionUrl=' } | Select-Object -First 1
if (-not $distributionLine) {
    throw 'Gradle distribution URL is not configured.'
}

$distributionUrl = $distributionLine.Substring('distributionUrl='.Length).Replace('\:', ':')

$version = $null
$match = [regex]::Match($distributionUrl, 'gradle-([0-9][^/]+?)(?:-bin|-all)?\.zip')
if ($match.Success) {
    $version = $match.Groups[1].Value
}

$webClient = [System.Net.WebClient]::new()
try {
    $jarBytes = $null

    if ($version) {
        $githubUrl = 'https://raw.githubusercontent.com/gradle/gradle/v' + $version + '/gradle/wrapper/gradle-wrapper.jar'
        try {
            Write-Host "Downloading Gradle wrapper JAR from $githubUrl"
            $jarBytes = $webClient.DownloadData($githubUrl)
        } catch {
            $jarBytes = $null
        }
    }

    if (-not $jarBytes) {
        Write-Host "Downloading Gradle wrapper artifacts from $distributionUrl"
        $tempZip = [System.IO.Path]::GetTempFileName()
        try {
            $webClient.DownloadFile($distributionUrl, $tempZip)
            $archive = [System.IO.Compression.ZipFile]::OpenRead($tempZip)
            try {
                function Get-EntryBytes {
                    param([System.IO.Compression.ZipArchiveEntry]$Entry)

                    if (-not $Entry) {
                        return $null
                    }

                    $memory = [System.IO.MemoryStream]::new()
                    try {
                        $Entry.Open().CopyTo($memory)
                        return $memory.ToArray()
                    } finally {
                        $memory.Dispose()
                    }
                }

                function Merge-Jars {
                    param(
                        [System.IO.Compression.ZipArchive]$Archive,
                        [System.IO.Compression.ZipArchiveEntry[]]$SharedEntries,
                        [System.IO.Compression.ZipArchiveEntry[]]$MainEntries,
                        [string]$Version
                    )

                    $sources = @()
                    if ($SharedEntries) {
                        $sources += $SharedEntries | Select-Object -First 1
                    }
                    if ($MainEntries) {
                        $sources += $MainEntries | Select-Object -First 1
                    }

                    if ($sources.Count -eq 0) {
                        return $null
                    }

                    $combinedStream = [System.IO.MemoryStream]::new()
                    $outArchive = [System.IO.Compression.ZipArchive]::new($combinedStream, [System.IO.Compression.ZipArchiveMode]::Create, $true)
                    try {
                        $manifestLines = @(
                            'Manifest-Version: 1.0',
                            'Main-Class: org.gradle.wrapper.GradleWrapperMain'
                        )
                        if ($Version) {
                            $manifestLines += 'Implementation-Title: Gradle'
                            $manifestLines += ('Implementation-Version: ' + $Version)
                        }
                        $manifestLines += ''

                        $manifestEntry = $outArchive.CreateEntry('META-INF/MANIFEST.MF')
                        $writer = [System.IO.StreamWriter]::new($manifestEntry.Open())
                        try {
                            $writer.Write(($manifestLines -join [Environment]::NewLine) + [Environment]::NewLine)
                        } finally {
                            $writer.Dispose()
                        }

                        $seen = [System.Collections.Generic.HashSet[string]]::new()
                        foreach ($sourceEntry in $sources) {
                            if (-not $sourceEntry) {
                                continue
                            }

                            $entryStream = [System.IO.MemoryStream]::new()
                            try {
                                $sourceEntry.Open().CopyTo($entryStream)
                                $entryStream.Seek(0, [System.IO.SeekOrigin]::Begin) | Out-Null
                                $innerArchive = [System.IO.Compression.ZipArchive]::new([System.IO.MemoryStream]::new($entryStream.ToArray()), [System.IO.Compression.ZipArchiveMode]::Read)
                                try {
                                    foreach ($innerEntry in $innerArchive.Entries) {
                                        if ($innerEntry.FullName.EndsWith('/')) {
                                            continue
                                        }
                                        if ($innerEntry.FullName.ToUpperInvariant() -eq 'META-INF/MANIFEST.MF') {
                                            continue
                                        }
                                        if (-not $seen.Add($innerEntry.FullName)) {
                                            continue
                                        }
                                        $target = $outArchive.CreateEntry($innerEntry.FullName, [System.IO.Compression.CompressionLevel]::Optimal)
                                        $targetStream = $target.Open()
                                        try {
                                            $innerEntry.Open().CopyTo($targetStream)
                                        } finally {
                                            $targetStream.Dispose()
                                        }
                                    }
                                } finally {
                                    $innerArchive.Dispose()
                                }
                            } finally {
                                $entryStream.Dispose()
                            }
                        }
                    } finally {
                        $outArchive.Dispose()
                    }

                    $result = $combinedStream.ToArray()
                    $combinedStream.Dispose()
                    return $result
                }

                $jarEntry = $archive.Entries | Where-Object { $_.FullName -like '*gradle-wrapper.jar' } | Select-Object -First 1
                $jarBytes = Get-EntryBytes -Entry $jarEntry

                if (-not $jarBytes) {
                    $sharedEntries = $archive.Entries | Where-Object { $_.FullName -like '*gradle-wrapper-shared*.jar' }
                    $mainEntries = $archive.Entries | Where-Object { $_.FullName -like '*gradle-wrapper-main*.jar' }
                    $jarBytes = Merge-Jars -Archive $archive -SharedEntries $sharedEntries -MainEntries $mainEntries -Version $version
                }
            } finally {
                $archive.Dispose()
            }
        } finally {
            Remove-Item -Path $tempZip -ErrorAction SilentlyContinue
        }
    }

    if (-not $jarBytes) {
        throw "Unable to locate Gradle wrapper classes in distribution: $distributionUrl"
    }

    $destinationDir = Split-Path -Path $wrapperJar -Parent
    if ($destinationDir) {
        [System.IO.Directory]::CreateDirectory($destinationDir) | Out-Null
    }

    [System.IO.File]::WriteAllBytes($wrapperJar, $jarBytes)
} finally {
    $webClient.Dispose()
}
