# GitHub Deployment Guide

This guide walks you through deploying the Images Free Viewing Task experiment on GitHub Pages.

## Step 1: Prepare Your Repository

### Create `.gitignore`

Create a `.gitignore` file in your project root:

```gitignore
# OS Files
.DS_Store
Thumbs.db

# IDE/Editor files
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
npm-debug.log*

# Runtime data
pids
*.pid
*.seed

# Temporary files
.tmp/
temp/

# Optional: Exclude large image files if needed
# images/original/*.jpg
# images/filler/*.jpg
```

### Update package info (optional)

Create a `package.json` for project metadata:

```json
{
  "name": "images-free-viewing-mouseview",
  "version": "1.0.0",
  "description": "Web-based psychological experiment using mouse spotlight to simulate eye tracking",
  "main": "index.html",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/images-free-viewing-mouseview.git"
  },
  "keywords": [
    "psychology",
    "experiment",
    "eye-tracking",
    "mouse-tracking",
    "research"
  ],
  "author": "Your Name",
  "license": "MIT"
}
```

## Step 2: Create GitHub Repository

1. **Go to GitHub.com** and sign in
2. **Click "+" → "New repository"**
3. **Repository settings**:

   - Name: `images-free-viewing-mouseview`
   - Description: "Web-based psychological experiment using mouse spotlight to simulate eye tracking"
   - ✅ Public (required for free GitHub Pages)
   - ✅ Add README file (uncheck this - we have our own)
   - ✅ Add .gitignore (select "Node" template, or use the one above)
   - License: MIT (recommended for open source)

4. **Click "Create repository"**

## Step 3: Upload Your Code

### Option A: GitHub Web Interface (Easiest)

1. **Download/zip your project folder**
2. **Go to your new repo** → "uploading an existing file"
3. **Drag & drop all files** (or select files)
4. **Commit message**: "Initial commit - Images Free Viewing Task"
5. **Click "Commit changes"**

### Option B: Git Command Line

```bash
# Navigate to your project folder
cd "/Users/szeling/Library/Mobile Documents/com~apple~CloudDocs/NUS/CTS Lab/Images Free Viewing Task (MouseView)"

# Initialize git
git init

# Add remote origin (replace 'yourusername' with your GitHub username)
git remote add origin https://github.com/yourusername/images-free-viewing-mouseview.git

# Add all files
git add .

# Commit
git commit -m "Initial commit - Images Free Viewing Task"

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Enable GitHub Pages

1. **Go to your repository** on GitHub
2. **Click "Settings"** tab
3. **Scroll down to "Pages"** (left sidebar)
4. **Source**: Select "Deploy from a branch"
5. **Branch**: Select "main" and "/ (root)"
6. **Click "Save"**

🎉 **Your experiment will be live at**: `https://yourusername.github.io/images-free-viewing-mouseview/`

## Step 5: Test Your Deployment

1. **Wait 2-3 minutes** for deployment
2. **Visit your GitHub Pages URL**
3. **Test the experiment**:
   - Images should load properly
   - Mouse tracking should work
   - Data download should function

## Important Notes for GitHub Pages

### ✅ What Works:

- Static files (HTML, CSS, JS)
- Image loading from relative paths
- Mouse tracking and data collection
- File downloads (CSV, ZIP)

### ⚠️ Limitations:

- No server-side processing
- No database storage
- Files must be under 100MB each
- Repository should be under 1GB total

### 🔧 Troubleshooting:

**Images not loading?**

- Check file paths in `stimuli-config.json`
- Ensure images are in `images/original/` and `images/filler/`
- Verify file extensions match exactly (case-sensitive)

**Experiment not starting?**

- Check browser console for errors
- Ensure all JS files are uploaded
- Verify MouseView.js CDN is accessible

**Data download issues?**

- GitHub Pages supports client-side downloads
- Files download directly to user's browser
- No server storage - data is ephemeral

## Customization for Your Lab

### Update Repository Info:

1. **Edit README.md** with your lab information
2. **Update package.json** with your details
3. **Add license** if needed
4. **Update contact information** in code comments

### Custom Domain (Optional):

1. **Settings** → **Pages** → **Custom domain**
2. **Add CNAME file** with your domain
3. **Configure DNS** with your domain provider

## Sharing Your Experiment

**Direct Link**: `https://yourusername.github.io/images-free-viewing-mouseview/`

**QR Code**: Generate QR code for easy mobile access

**Embed**: Use iframe to embed in other websites

```html
<iframe
  src="https://yourusername.github.io/images-free-viewing-mouseview/"
  width="100%"
  height="600px"
  frameborder="0"
>
</iframe>
```

## Maintenance

### Updating the Experiment:

1. **Make changes** to your local files
2. **Upload via web interface** or use git:
   ```bash
   git add .
   git commit -m "Update experiment"
   git push
   ```
3. **Changes go live** within minutes

### Monitoring:

- **Repository insights** for visitor statistics
- **Issues tab** for user feedback
- **Browser console** for debugging

---

**Need help?** Check GitHub's [Pages documentation](https://docs.github.com/en/pages) or open an issue in your repository.
