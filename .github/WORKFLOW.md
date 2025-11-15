# GitHub Actions Workflow Diagram

## 🔄 How the Build Process Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     Developer Actions                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   git push origin     │
                    │        master         │
                    └───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Actions                             │
│                    (Triggered Automatically)                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
    ┌────────────────────┐          ┌────────────────────┐
    │  Windows Runner    │          │   macOS Runner     │
    │  (windows-latest)  │          │  (macos-latest)    │
    └────────────────────┘          └────────────────────┘
                │                               │
                ▼                               ▼
    ┌────────────────────┐          ┌────────────────────┐
    │ 1. Checkout Code   │          │ 1. Checkout Code   │
    │ 2. Setup Node 20   │          │ 2. Setup Node 20   │
    │ 3. npm install     │          │ 3. npm install     │
    │ 4. Build React App │          │ 4. Build React App │
    │ 5. Build Electron  │          │ 5. Build Electron  │
    └────────────────────┘          └────────────────────┘
                │                               │
                ▼                               ▼
    ┌────────────────────┐          ┌────────────────────┐
    │   Windows Build    │          │    macOS Build     │
    │                    │          │                    │
    │ • .exe (portable)  │          │  • .dmg (disk img) │
    │ • better-sqlite3   │          │  • better-sqlite3  │
    │   compiled for     │          │    compiled for    │
    │   Windows          │          │    macOS           │
    └────────────────────┘          └────────────────────┘
                │                               │
                ▼                               ▼
    ┌────────────────────┐          ┌────────────────────┐
    │  Upload Artifact   │          │  Upload Artifact   │
    │  "windows-build"   │          │   "macos-build"    │
    └────────────────────┘          └────────────────────┘
                │                               │
                └───────────────┬───────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Artifacts Available                          │
│             (Download from Actions tab)                         │
│                  Retained for 30 days                           │
└─────────────────────────────────────────────────────────────────┘
```

## 🏷️ Release Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Create GitHub Release                        │
│              (Tag: v1.0.0, v1.1.0, etc.)                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              GitHub Actions Auto-Triggered                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
        Build Windows                   Build macOS
                │                               │
                ▼                               ▼
    Attach .exe to Release          Attach .dmg to Release
                │                               │
                └───────────────┬───────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│               Release Published with Assets                     │
│                                                                 │
│  Users can download:                                            │
│  • Cricket-Scoring-App-1.0.0.exe (Windows)                     │
│  • Cricket-Scoring-App-1.0.0.dmg (macOS)                       │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Workflow Triggers

| Trigger | Action | Result |
|---------|--------|--------|
| `git push` to master/main | Build only | Artifacts uploaded to Actions tab |
| Pull Request | Build only | Check if PR breaks build |
| Create Release (tag) | Build + Attach | Installers attached to release |

## ⚙️ Build Matrix

The workflow uses a matrix strategy to build on multiple platforms in parallel:

```yaml
strategy:
  matrix:
    os: [macos-latest, windows-latest]
```

This means:
- Both builds run simultaneously
- Faster total build time (~10 minutes instead of 20)
- Independent failures (one can succeed while other fails)

## 🔐 Native Dependencies

**Challenge**: `better-sqlite3` requires platform-specific compilation

**Solution**:
1. `postinstall` script runs `electron-builder install-app-deps`
2. This compiles native dependencies for the target platform
3. Windows runner compiles for Windows
4. macOS runner compiles for macOS
5. Each build is native and optimized

## 📦 Build Output Structure

```
release/
├── Cricket Scoring App-1.0.0.exe       (Windows portable)
├── Cricket Scoring App-1.0.0.exe.blockmap
├── Cricket Scoring App-1.0.0.dmg       (macOS disk image)
├── Cricket Scoring App-1.0.0.dmg.blockmap
└── builder-effective-config.yaml
```

## 🚀 Performance

Typical build times:
- **macOS build**: ~8-10 minutes
- **Windows build**: ~6-8 minutes
- **Total (parallel)**: ~10 minutes

## 💡 Pro Tips

1. **Test locally first**: Run `npm run electron:build:mac` before pushing
2. **Check build logs**: Click on failed jobs to see detailed error messages
3. **Artifacts expire**: Download within 30 days or re-run workflow
4. **Tag format**: Use semantic versioning (v1.0.0, v1.1.0, v2.0.0)
5. **Draft releases**: Create draft releases to test before publishing

## 🐛 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Build fails on Windows | Missing native dep | Check better-sqlite3 version |
| Artifact not found | Build didn't complete | Check build logs for errors |
| Release not created | Tag not pushed | Use `git push origin v1.0.0` |
| App won't run | Missing dependencies | Check electron version compatibility |

## 📈 Monitoring Builds

1. **Real-time**: Watch progress in Actions tab
2. **Notifications**: GitHub can email on build failures
3. **Status badge**: Add to README for quick status check
4. **Logs**: Detailed logs available for 90 days

## 🎯 Best Practices

✅ **DO:**
- Test builds locally before pushing
- Use semantic versioning for releases
- Document changes in release notes
- Keep dependencies updated

❌ **DON'T:**
- Push to master without testing
- Create releases for every commit
- Include sensitive data in commits
- Ignore build warnings

---

**Need help?** Check [SETUP.md](.github/SETUP.md) for detailed documentation!
