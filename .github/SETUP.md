# GitHub Actions Setup Guide

This project uses GitHub Actions to automatically build the Cricket Scoring App for both Windows and macOS.

## How It Works

The workflow (`.github/workflows/build.yml`) automatically runs when you:
- Push code to `master` or `main` branch
- Create a pull request
- Create a GitHub release

## What Gets Built

- **Windows**: Portable `.exe` installer
- **macOS**: `.dmg` disk image

## Setup Steps

### 1. Push Your Code to GitHub

If you haven't already created a GitHub repository:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit with GitHub Actions"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/cricket-scoring-app.git
git branch -M main
git push -u origin main
```

### 2. Enable GitHub Actions

GitHub Actions is enabled by default for public repositories. For private repositories:
1. Go to your repository on GitHub
2. Click **Settings** → **Actions** → **General**
3. Under "Actions permissions", select **Allow all actions and reusable workflows**

### 3. Automatic Builds

Once pushed, GitHub Actions will automatically:
- Build for Windows on Windows runner
- Build for macOS on macOS runner
- Upload build artifacts that you can download

### 4. View Build Status

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. You'll see all workflow runs with their status
4. Click on a run to see detailed logs

### 5. Download Built Apps

After a successful build:
1. Go to the **Actions** tab
2. Click on the completed workflow run
3. Scroll down to **Artifacts** section
4. Download:
   - `windows-build.zip` - Contains the Windows installer
   - `macos-build.zip` - Contains the macOS DMG

## Creating a Release

To automatically publish builds to a GitHub release:

```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0

# OR create a release on GitHub:
# 1. Go to Releases → Create a new release
# 2. Create a tag (e.g., v1.0.0)
# 3. Fill in release notes
# 4. Publish release
```

The workflow will automatically:
- Build for both platforms
- Attach installers to the release
- Make them available for download

## Troubleshooting

### Build Fails on Windows
- Check the Actions logs for specific errors
- Most common: native dependency compilation issues
- Solution: The workflow handles `better-sqlite3` compilation automatically

### Build Fails on macOS
- Check for code signing issues (not required for DMG)
- Ensure all dependencies are compatible with macOS

### Artifacts Not Appearing
- Check that the build completed successfully
- Artifacts are retained for 30 days by default
- Look in the "Artifacts" section at the bottom of the workflow run page

## Local Testing

Before pushing, you can test locally:

```bash
# Test macOS build (on macOS)
npm run electron:build:mac

# Test Windows build (on Windows)
npm run electron:build:win
```

**Note**: Cross-platform building from macOS to Windows locally won't work due to native dependencies. That's why we use GitHub Actions!

## Build Configuration

The build configuration is in `package.json` under the `"build"` field:

- **Windows**: Creates portable .exe
- **macOS**: Creates .dmg disk image
- **Output directory**: `release/`

## Files Included in Build

The workflow is configured to include:
- `dist/**/*` - Built React app
- `electron/**/*` - Electron main process files
- `node_modules/**/*` - Dependencies (including better-sqlite3)
- `package.json` - Package metadata

## Customization

To modify the build:

1. **Change build targets**: Edit `package.json` → `build` → `win`/`mac` → `target`
2. **Add platforms**: Add Linux by uncommenting in workflow
3. **Change triggers**: Edit `.github/workflows/build.yml` → `on:` section

## Support

For issues with GitHub Actions:
- Check the [Actions documentation](https://docs.github.com/en/actions)
- Review workflow logs for detailed error messages
- Check electron-builder [documentation](https://www.electron.build/)
