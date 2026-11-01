---
name: windows-dev
description: "Trigger: writing scripts, npm scripts, file paths, or anything that must behave the same on Windows, macOS, and Linux."
license: MIT
metadata:
  author: exentra
  version: "1.0"
---

## Shell

- The default shell is PowerShell 5.1 or later. Write scripts that run on 5.1:
  no `??`, no ternary operator, no `-Parallel`.
- No bash-isms in scripts: `rm`, `cp`, `export`, `chmod`, `&&` chains.
- In npm scripts, `&&` works on both cmd and sh. Anything else does not.

## Paths

- `Join-Path` in PowerShell, `path.join` in Node. Never concatenate with `\` or `/`.
- Quote any path that may contain spaces.
- Forward slashes in JSON and config files; they work everywhere.
- Never assume a POSIX path in generated code.

## Environment variables in scripts

```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development vite",
    "test": "cross-env NODE_ENV=test vitest run"
  }
}
```

Without `cross-env`, `NODE_ENV=x` fails on Windows.

## Files

- Write UTF-8 without BOM. PowerShell 5.1 defaults to UTF-16 for `>` redirection:
  use `Set-Content -Encoding UTF8` or `Out-File -Encoding utf8`.
- Line endings are normalized by `.gitattributes`:

```gitattributes
* text=auto eol=lf
*.cmd text eol=crlf
*.bat text eol=crlf
```

- Enable long paths once per machine:

```powershell
git config --global core.longpaths true
```

## Links

- Never `New-Item -ItemType SymbolicLink` without elevation.
- Use a junction, which needs no admin rights:

```powershell
New-Item -ItemType Junction -Path C:\project\.opencode -Target C:\tools\exentra-ai-dev
```

## Process and ports

- `Get-NetTCPConnection -LocalPort 3000` instead of `lsof`.
- Kill by id: `Stop-Process -Id <pid>`.
- Paths in `PATH` are separated by `;`, not `:`.

## CI

- Run the test suite on `windows-latest` and `ubuntu-latest`.
- Never let a script depend on a shell that only exists on one platform.
- Use `shell: pwsh` explicitly in GitHub Actions when the step needs PowerShell.

## Checklist

- [ ] No bash-only commands.
- [ ] Every path built with a path API.
- [ ] Env vars set through `cross-env`.
- [ ] UTF-8 without BOM.
- [ ] Works on Windows and Linux CI.
