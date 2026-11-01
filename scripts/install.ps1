<#
.SYNOPSIS
    Installs the exentra-ai-dev harness into a project or into the global OpenCode config.

.DESCRIPTION
    Copies agents, skills, commands and contexts, composes the project AGENTS.md,
    and merges the harness configuration. Idempotent: running it twice produces the
    same result and never duplicates the generated blocks.

.PARAMETER Target
    Project directory. Defaults to the current directory. Ignored in global mode.

.PARAMETER Profile
    Contexts to compose into AGENTS.md. One or more of:
    nextjs, web-spa, api, data, saas.

.PARAMETER Mode
    project (default) installs into <Target>\.opencode and <Target>\opencode.jsonc.
    global installs into the user OpenCode config directory.

.PARAMETER Force
    Overwrite the harness config even when the merge cannot run.

.EXAMPLE
    .\scripts\install.ps1 -Target C:\code\acme -Profile nextjs,saas

.EXAMPLE
    .\scripts\install.ps1 -Mode global
#>
[CmdletBinding()]
param(
    [string]$Target = (Get-Location).Path,
    [string[]]$Profile = @('nextjs'),
    [ValidateSet('project', 'global')]
    [string]$Mode = 'project',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$SourceRoot = Split-Path -Parent $PSScriptRoot
$BeginMarker = '<!-- exentra-ai-dev:begin -->'
$EndMarker = '<!-- exentra-ai-dev:end -->'
$VerifyBegin = '<!-- exentra-ai-dev:verify:begin -->'
$VerifyEnd = '<!-- exentra-ai-dev:verify:end -->'

function Write-Step([string]$Message) {
    Write-Host ("  " + $Message) -ForegroundColor DarkGray
}

function Write-Ok([string]$Message) {
    Write-Host ("  [ok]   " + $Message) -ForegroundColor Green
}

function Write-Warn([string]$Message) {
    Write-Host ("  [warn] " + $Message) -ForegroundColor Yellow
}

function Write-Fail([string]$Message) {
    Write-Host ("  [fail] " + $Message) -ForegroundColor Red
}

function Read-Text([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    $text = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
    if ($text.Length -gt 0 -and $text[0] -eq [char]0xFEFF) {
        $text = $text.Substring(1)
    }
    return $text
}

function Write-Text([string]$Path, [string]$Text) {
    $parent = Split-Path -Parent $Path
    if ($parent -and -not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    [System.IO.File]::WriteAllText($Path, $Text, $Utf8NoBom)
}

function Copy-Tree([string]$From, [string]$To) {
    if (-not (Test-Path -LiteralPath $From)) {
        Write-Warn ("missing source: " + $From)
        return 0
    }
    if (-not (Test-Path -LiteralPath $To)) {
        New-Item -ItemType Directory -Force -Path $To | Out-Null
    }
    $count = 0
    Get-ChildItem -LiteralPath $From -Recurse -File | ForEach-Object {
        $relative = $_.FullName.Substring($From.Length).TrimStart('\', '/')
        $destination = Join-Path $To $relative
        Write-Text $destination ([System.IO.File]::ReadAllText($_.FullName))
        $count = $count + 1
    }
    return $count
}

function Get-DetectedVerifyBlock([string]$ProjectRoot) {
    $packageJson = Join-Path $ProjectRoot 'package.json'
    if (-not (Test-Path -LiteralPath $packageJson)) {
        return @('- lint: `npm run lint`', '- build: `npm run build`', '- test: `npm test`')
    }
    try {
        $json = Read-Text $packageJson | ConvertFrom-Json
    }
    catch {
        return @('- lint: `npm run lint`', '- build: `npm run build`', '- test: `npm test`')
    }
    if (-not $json.PSObject.Properties.Match('scripts').Count) {
        return @('- test: `npm test`')
    }
    $scripts = $json.scripts
    $lines = New-Object System.Collections.Generic.List[string]
    $mapping = @(
        @('lint', 'lint'),
        @('typecheck', 'typecheck'),
        @('build', 'build'),
        @('test', 'test')
    )
    foreach ($pair in $mapping) {
        $key = $pair[0]
        if ($scripts.PSObject.Properties.Match($key).Count) {
            $lines.Add('- ' + $key + ': `npm run ' + $key + '`')
        }
    }
    if ($lines.Count -eq 0) {
        $lines.Add('- test: `npm test`')
    }
    return $lines.ToArray()
}

function Set-Block([string]$Content, [string]$Begin, [string]$End, [string]$Block) {
    $pattern = [regex]::Escape($Begin) + '[\s\S]*?' + [regex]::Escape($End)
    $replacement = $Begin + "`n" + $Block.TrimEnd() + "`n" + $End
    if ($Content -match $pattern) {
        return [regex]::Replace($Content, $pattern, [System.Text.RegularExpressions.MatchEvaluator] { param($m) $replacement })
    }
    $separator = ''
    if ($Content.Length -gt 0 -and -not $Content.EndsWith("`n")) {
        $separator = "`n`n"
    }
    elseif ($Content.Length -gt 0) {
        $separator = "`n"
    }
    return $Content + $separator + $replacement + "`n"
}

# ---------------------------------------------------------------------------
# Resolve destinations
# ---------------------------------------------------------------------------

if ($Mode -eq 'global') {
    $configHome = $env:XDG_CONFIG_HOME
    if (-not $configHome) {
        $configHome = Join-Path $env:USERPROFILE '.config'
    }
    $ConfigRoot = Join-Path $configHome 'opencode'
    $AssetRoot = $ConfigRoot
    $AgentsPath = Join-Path $ConfigRoot 'AGENTS.md'
    $ProjectRoot = $null
}
else {
    if (-not (Test-Path -LiteralPath $Target)) {
        throw ("Target does not exist: " + $Target)
    }
    $ProjectRoot = (Resolve-Path -LiteralPath $Target).Path
    $ConfigRoot = Join-Path $ProjectRoot '.opencode'
    $AssetRoot = $ConfigRoot
    $AgentsPath = Join-Path $ProjectRoot 'AGENTS.md'
}

Write-Host ''
Write-Host 'exentra-ai-dev installer' -ForegroundColor Cyan
Write-Host ('  mode   : ' + $Mode)
if ($Mode -eq 'project') {
    Write-Host ('  target : ' + $ProjectRoot)
}
else {
    Write-Host ('  target : ' + $ConfigRoot)
}
Write-Host ('  profile: ' + ($Profile -join ', '))
Write-Host ''

# ---------------------------------------------------------------------------
# Validate profile
# ---------------------------------------------------------------------------

$availableContexts = @()
$contextsDir = Join-Path $SourceRoot 'contexts'
if (Test-Path -LiteralPath $contextsDir) {
    $availableContexts = Get-ChildItem -LiteralPath $contextsDir -File -Filter '*.md' |
        ForEach-Object { $_.BaseName }
}
foreach ($name in $Profile) {
    if ($availableContexts -notcontains $name) {
        throw ('Unknown profile "' + $name + '". Available: ' + ($availableContexts -join ', '))
    }
}

# ---------------------------------------------------------------------------
# Copy assets
# ---------------------------------------------------------------------------

$total = 0
$total = $total + (Copy-Tree (Join-Path $SourceRoot 'agents') (Join-Path $AssetRoot 'agents'))
$total = $total + (Copy-Tree (Join-Path $SourceRoot 'skills') (Join-Path $AssetRoot 'skills'))
$total = $total + (Copy-Tree (Join-Path $SourceRoot 'commands') (Join-Path $AssetRoot 'commands'))
$total = $total + (Copy-Tree (Join-Path $SourceRoot 'contexts') (Join-Path $AssetRoot 'exentra\contexts'))
$total = $total + (Copy-Tree (Join-Path $SourceRoot 'docs') (Join-Path $AssetRoot 'exentra\docs'))
Write-Ok ($total.ToString() + ' files copied to ' + $AssetRoot)

# ---------------------------------------------------------------------------
# Compose AGENTS.md
# ---------------------------------------------------------------------------

$corePath = Join-Path $SourceRoot 'AGENTS.md'
$core = Read-Text $corePath
if (-not $core) {
    throw ('Missing source AGENTS.md at ' + $corePath)
}

$verifyLines = Get-DetectedVerifyBlock $ProjectRoot
$verifyBlock = ($verifyLines -join "`n")
$core = Set-Block $core $VerifyBegin $VerifyEnd $verifyBlock

$contextParts = New-Object System.Collections.Generic.List[string]
foreach ($name in $Profile) {
    $contextPath = Join-Path $contextsDir ($name + '.md')
    $contextParts.Add((Read-Text $contextPath).TrimEnd())
}
$composed = $core.TrimEnd()
if ($contextParts.Count -gt 0) {
    $composed = $composed + "`n`n" + ($contextParts -join "`n`n")
}

$existingAgents = Read-Text $AgentsPath
if (-not $existingAgents) {
    $existingAgents = ''
}
$updatedAgents = Set-Block $existingAgents $BeginMarker $EndMarker $composed
Write-Text $AgentsPath $updatedAgents
Write-Ok ('AGENTS.md composed with ' + $Profile.Count + ' context(s)')

# ---------------------------------------------------------------------------
# Merge configuration
# ---------------------------------------------------------------------------

$harnessConfig = Join-Path $SourceRoot 'opencode.jsonc'
if ($Mode -eq 'global') {
    $targetConfig = Join-Path $ConfigRoot 'opencode.json'
}
else {
    $targetConfig = Join-Path $ProjectRoot 'opencode.jsonc'
}

$mergeScript = Join-Path $SourceRoot 'scripts\merge-config.mjs'
$node = Get-Command node -ErrorAction SilentlyContinue

if (-not (Test-Path -LiteralPath $targetConfig)) {
    Write-Text $targetConfig (Read-Text $harnessConfig)
    Write-Ok ('config written: ' + $targetConfig)
}
elseif ($node -and (Test-Path -LiteralPath $mergeScript)) {
    $backup = $targetConfig + '.bak-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
    Copy-Item -LiteralPath $targetConfig -Destination $backup -Force
    & $node.Source $mergeScript $targetConfig $harnessConfig $targetConfig
    if ($LASTEXITCODE -ne 0) {
        Write-Fail ('merge failed, backup kept at ' + $backup)
        if (-not $Force) {
            throw 'Configuration merge failed. Fix the existing config or pass -Force to overwrite.'
        }
        Write-Text $targetConfig (Read-Text $harnessConfig)
        Write-Warn ('overwrote config with the harness version: ' + $targetConfig)
    }
    else {
        Write-Ok ('config merged: ' + $targetConfig + ' (backup: ' + (Split-Path -Leaf $backup) + ')')
    }
}
else {
    $fallback = Join-Path (Split-Path -Parent $targetConfig) 'opencode.exentra.jsonc'
    Write-Text $fallback (Read-Text $harnessConfig)
    Write-Warn ('node or merge script unavailable. Harness config written to ' + $fallback)
    Write-Warn 'Merge its agents, permissions, mcp and compaction blocks into your config manually.'
}

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host 'Next steps' -ForegroundColor Cyan
Write-Host '  1. Open the project with OpenCode.'
Write-Host '  2. Pick an agent with /agents, or use a command such as /map or /review.'
Write-Host '  3. Run .\scripts\doctor.ps1 to verify the environment.'
Write-Host ''
