# GitHub Actions Quick Start Guide

## 🚀 Get Your App Built on GitHub (5 Minutes)

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and log in
2. Click the **+** icon (top right) → **New repository**
3. Repository name: `cricket-scoring-app` (or your choice)
4. Choose **Public** or **Private**
5. **Do NOT** initialize with README (we already have files)
6. Click **Create repository**

### Step 2: Push Your Code

Copy the repository URL from GitHub, then run:

```bash
# Check if git is initialized
git status

# If not initialized, run:
git init

# Add all files
git add .

# Commit
git commit -m "Add GitHub Actions for Windows and macOS builds"

# Add remote (replace with YOUR repository URL)
git remote add origin https://github.com/YOUR_USERNAME/cricket-scoring-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Watch the Magic Happen ✨

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. You'll see the workflow running (yellow dot = in progress)
4. Wait ~5-10 minutes for builds to complete

### Step 4: Download Your Apps

Once the build completes (green checkmark):

1. Click on the completed workflow run
2. Scroll down to **Artifacts**
3. Download:
   - **windows-build** - Contains `.exe` installer for Windows
   - **macos-build** - Contains `.dmg` for macOS

### Step 5: Test Your Apps

**On Windows:**
- Extract `windows-build.zip`
- Run the `.exe` file
- App installs and runs!

**On macOS:**
- Extract `macos-build.zip`
- Open the `.dmg` file
- Drag app to Applications folder
- Run the app!

## 🎯 Create a Release (Optional)

To create a public release with download links:

```bash
# Create a version tag
git tag v1.0.0

# Push the tag
git push origin v1.0.0
```

**OR** on GitHub:
1. Go to **Releases** → **Create a new release**
2. Click **Choose a tag** → Type `v1.0.0` → **Create new tag**
3. Release title: `Cricket Scoring App v1.0.0`
4. Description: List your features and changes
5. Click **Publish release**

GitHub Actions will automatically:
- Build Windows and macOS versions
- Attach them to the release
- Users can download directly from Releases page

## 📊 Build Status

Add a build badge to your README:

```markdown
![Build Status](https://github.com/YOUR_USERNAME/cricket-scoring-app/workflows/Build/release/badge.svg)
```

## ❓ Troubleshooting

### "remote: Repository not found"
- Check the repository URL is correct
- Make sure you have permission to push
- Try: `git remote -v` to verify remote URL

### "Updates were rejected"
- Run: `git pull origin main --rebase`
- Then: `git push -u origin main`

### Build fails on GitHub
- Click on the failed workflow
- Click on the job that failed (Windows or macOS)
- Read the error logs
- Common fix: Check `package.json` for syntax errors

### Can't download artifacts
- Artifacts expire after 30 days
- Re-run the workflow to generate new builds
- Make sure the build completed successfully (green checkmark)

## 🎉 Next Steps

Your app is now set up to build automatically! Every time you push code:
- GitHub Actions builds for Windows and macOS
- You can download and test the installers
- Release versions get attached to GitHub Releases

**Pro tip**: Test locally with `npm run electron:build:mac` before pushing to save time!

## 📝 What We Set Up

✅ GitHub Actions workflow (`.github/workflows/build.yml`)
✅ Builds for Windows (portable .exe)
✅ Builds for macOS (.dmg)
✅ Automatic artifact uploads
✅ Release automation
✅ Updated .gitignore
✅ Added postinstall script for native dependencies

You're all set! 🎊
