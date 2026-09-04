$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$domainPath = Join-Path $root "prototype_v2/assets/js/domain-data.js"
$appPath = Join-Path $root "prototype_v2/assets/js/app.js"
$htmlPath = Join-Path $root "prototype_v2/index.html"
$domain = Get-Content -Raw $domainPath
$app = Get-Content -Raw $appPath
$html = Get-Content -Raw $htmlPath
$passed = 0

function Assert-Check([string]$name, [bool]$condition) {
  if (-not $condition) { throw "FAIL: $name" }
  $script:passed += 1
  Write-Output "PASS: $name"
}

Assert-Check "V2 entry files exist" ((Test-Path $htmlPath) -and (Test-Path $domainPath) -and (Test-Path $appPath))
Assert-Check "WidebandScene root model exists" ($domain.Contains("WidebandScene: scene"))
Assert-Check "five SignalInstance examples exist" (([regex]::Matches($domain, 'id: "SIG-\d{3}"')).Count -ge 5)
Assert-Check "continuous burst hopping behaviors exist" (($domain.Contains('behavior: "continuous"')) -and ($domain.Contains('behavior: "burst"')) -and ($domain.Contains('behavior: "hopping"')))
Assert-Check "scene and instance layers are distinct" (($domain.Contains("background:")) -and ($domain.Contains("signal_instances:")) -and ($domain.Contains("cnr_db:")) -and ($domain.Contains("snr_db:")))
Assert-Check "TF provenance and resolution formula are represented" (($domain.Contains("fft_length:")) -and ($app.Contains("sampling_rate_sps / tf.fft_length")))
$routeFailures = (@("/scene-builder", "/scene-detail", "/annotation", "/extraction", "/narrowband", "/dataset", "/training", "/experiment", "/models", "/evaluation") | ForEach-Object { $app.Contains("`"$_`"") } | Where-Object { -not $_ } | Measure-Object).Count
Assert-Check "required V2 route set exists" ($routeFailures -eq 0)
Assert-Check "annotation schema and extraction chain exist" (($app.Contains("t_start_s")) -and ($app.Contains("DDC / Filter / Resample")) -and ($app.Contains("ExtractedSignal")))
Assert-Check "wideband evaluation metric set exists" ((@("Pd", "Pfa", "Precision", "Recall", "F1", "AP / mAP", "Center Frequency Error", "Bandwidth Error", "Time Boundary Error") | ForEach-Object { $app.Contains($_) } | Where-Object { -not $_ } | Measure-Object).Count -eq 0)
Assert-Check "seven condition curves exist" ((@("Pd vs SNR / CNR", "Pd vs Bandwidth", "Pd vs Duration", "Pd vs Signal Count", "Pd vs Occupancy", "Pd vs Frequency Separation", "Pd vs Power Difference") | ForEach-Object { $app.Contains($_) } | Where-Object { -not $_ } | Measure-Object).Count -eq 0)
Assert-Check "V1 baseline hashes still match" ((Get-Content (Join-Path $root "docs/V1_SHA256_BASELINE.txt") -Encoding UTF8 | Where-Object { $_ -match '^.+\.html [A-F0-9]{64}$' } | ForEach-Object { $parts = $_ -split ' '; $actual = (Get-FileHash (Join-Path $root $parts[0]) -Algorithm SHA256).Hash; $actual -eq $parts[1] } | Where-Object { -not $_ } | Measure-Object).Count -eq 0)
Assert-Check "no external media dependency in V2" (($html -notmatch 'https?://') -and ($app -notmatch 'https?://'))

Write-Output "V2 verification completed: $passed checks passed."
