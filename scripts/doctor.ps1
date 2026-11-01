<#
.SYNOPSIS
    Checks the machine and the current project for everything exentra-ai-dev needs.

.DESCRIPTION
    Read-only. Prints PASS, WARN, or FAIL per check and exits 1 when any check
    fails. Optional tools produce a warning, never a failure.

.PARAMETER Target
    Project to inspect. Defaults to the current directory.

.EXAMPLE
    .\scripts\doctor.ps1

.EXAMPLE
    .\scripts\doctor.ps1 -Target C:\code\acme
#>
[CmdletBinding()]
param(
    [string]$Target = (Get-Location).Path
)

$ErrorActionPreference = 'Continue'
Set-StrictMode -Version 2.0

$script:failures = 0
$script:warnings = 0

function Report([string]$Status, [string]$Name, [string]$Detail) {
    $color = 'Green'
    if ($Status -eq 'WARN') {
        $color = 'Yellow'
        $script:warnings = $script:warnings + 1
    }
    elseif ($Status -eq 'FAIL') {
        $color = 'Red'
        $script:failures = $script:failures + 1
    }
    $label = '[' + $Status.PadRight(4) + ']'
    Write-Host ($label + ' ' + $Name.PadRight(22) + ' ' + $Detail) -ForegroundColor $color
}

function Get-VersionText([string]$CommandName, [string[]]$Arguments) {
    try {
        $output = & $CommandName @Arguments 2>&1
        return ($output | Select-Object -First 1).ToString().Trim()
    }
    catch {
        return $null
    }
}

Write-Host ''
Write-Host 'exentra-ai-dev doctor' -ForegroundColor Cyan
Write-Host ('  project: ' + $Target)
Write-Host ''

# ---------------------------------------------------------------------------
# Runtime
# ---------------------------------------------------------------------------

$psVersion = $PSVersionTable.PSVersion
if ($psVersion.Major -ge 5) {
    Report 'PASS' 'PowerShell' ($psVersion.ToString())
}
else {
    Report 'FAIL' 'PowerShell' ('found ' + $psVersion.ToString() + ', need 5.1 or later')
}

$pwsh = Get-Command pwsh -ErrorAction SilentlyContinue
if ($pwsh) {
    Report 'PASS' 'pwsh' $pwsh.Source
}
else {
    Report 'WARN' 'pwsh' 'not installed; scripts run on Windows PowerShell 5.1'
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Report 'FAIL' 'node' 'not found in PATH'
}
else {
    $nodeVersion = Get-VersionText $node.Source @('--version')
    $major = 0
    if ($nodeVersion -match 'v(\d+)') {
        $major = [int]$Matches[1]
    }
    if ($major -ge 20) {
        Report 'PASS' 'node' $nodeVersion
    }
    else {
        Report 'FAIL' 'node' ($nodeVersion + ', need 20 or later')
    }
}

$git = Get-Command git -ErrorAction SilentlyContinue
if ($git) {
    Report 'PASS' 'git' (Get-VersionText $git.Source @('--version'))
}
else {
    Report 'FAIL' 'git' 'not found in PATH'
}

$opencode = Get-Command opencode -ErrorAction SilentlyContinue
if ($opencode) {
    Report 'PASS' 'opencode' $opencode.Source
}
else {
    Report 'FAIL' 'opencode' 'not found in PATH'
}

$gh = Get-Command gh -ErrorAction SilentlyContinue
if ($gh) {
    Report 'PASS' 'gh' (Get-VersionText $gh.Source @('--version'))
}
else {
    Report 'WARN' 'gh' 'not installed; only needed to publish repositories'
}

# ---------------------------------------------------------------------------
# Optional MCP tools
# ---------------------------------------------------------------------------

$engram = Get-Command engram -ErrorAction SilentlyContinue
if ($engram) {
    Report 'PASS' 'engram' $engram.Source
}
else {
    Report 'WARN' 'engram' 'not installed; persistent memory will be unavailable'
}

$codegraph = Get-Command codegraph -ErrorAction SilentlyContinue
if ($codegraph) {
    Report 'PASS' 'codegraph' $codegraph.Source
}
else {
    Report 'WARN' 'codegraph' 'not installed; code mapping falls back to grep'
}

# ---------------------------------------------------------------------------
# Project installation
# ---------------------------------------------------------------------------

if (-not (Test-Path -LiteralPath $Target)) {
    Report 'FAIL' 'project' ('path does not exist: ' + $Target)
}
else {
    $projectRoot = (Resolve-Path -LiteralPath $Target).Path

    $configCandidates = @(
        (Join-Path $projectRoot 'opencode.jsonc'),
        (Join-Path $projectRoot 'opencode.json')
    )
    $configFound = $null
    foreach ($candidate in $configCandidates) {
        if (Test-Path -LiteralPath $candidate) {
            $configFound = $candidate
            break
        }
    }
    if ($configFound) {
        Report 'PASS' 'project config' $configFound
    }
    else {
        Report 'FAIL' 'project config' 'no opencode.jsonc or opencode.json in the project root'
    }

    $agentsPath = Join-Path $projectRoot 'AGENTS.md'
    if (Test-Path -LiteralPath $agentsPath) {
        $agentsText = [System.IO.File]::ReadAllText($agentsPath)
        if ($agentsText.Contains('<!-- exentra-ai-dev:begin -->')) {
            Report 'PASS' 'AGENTS.md' 'harness block present'
        }
        else {
            Report 'WARN' 'AGENTS.md' 'exists but has no exentra-ai-dev block'
        }
    }
    else {
        Report 'FAIL' 'AGENTS.md' 'missing in the project root'
    }

    $assetRoot = Join-Path $projectRoot '.opencode'
    foreach ($asset in @('agents', 'skills', 'commands')) {
        $assetPath = Join-Path $assetRoot $asset
        if (Test-Path -LiteralPath $assetPath) {
            $count = (Get-ChildItem -LiteralPath $assetPath -Recurse -File).Count
            Report 'PASS' ('.opencode/' + $asset) ($count.ToString() + ' files')
        }
        else {
            Report 'FAIL' ('.opencode/' + $asset) 'missing; run scripts\install.ps1'
        }
    }

    $packageJson = Join-Path $projectRoot 'package.json'
    if (Test-Path -LiteralPath $packageJson) {
        try {
            $json = [System.IO.File]::ReadAllText($packageJson) | ConvertFrom-Json
            $found = New-Object System.Collections.Generic.List[string]
            foreach ($key in @('lint', 'typecheck', 'build', 'test')) {
                if ($json.PSObject.Properties.Match('scripts').Count) {
                    if ($json.scripts.PSObject.Properties.Match($key).Count) {
                        $found.Add($key)
                    }
                }
            }
            if ($found.Count -gt 0) {
                Report 'PASS' 'verify scripts' ($found -join ', ')
            }
            else {
                Report 'WARN' 'verify scripts' 'no lint, typecheck, build, or test script'
            }
        }
        catch {
            Report 'WARN' 'verify scripts' 'package.json could not be parsed'
        }
    }
    else {
        Report 'WARN' 'verify scripts' 'no package.json; set them manually in AGENTS.md'
    }
}

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

Write-Host ''
if ($script:failures -eq 0) {
    Write-Host ('Ready. ' + $script:warnings.ToString() + ' warning(s).') -ForegroundColor Green
    exit 0
}
Write-Host ($script:failures.ToString() + ' failure(s), ' + $script:warnings.ToString() + ' warning(s).') -ForegroundColor Red
exit 1
