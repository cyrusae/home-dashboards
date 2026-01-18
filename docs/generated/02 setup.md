# Phase 1 Dashboard - Individual Files Setup Guide

## Files Available for Download

All these files are in your outputs folder ready to download:

```
📥 STEP 1: Read These First
├─ DIRECTORY_STRUCTURE.md          ← Start here (visual folder layout)
├─ FILE_INDEX.md                   ← What each file does
└─ QUICK_START.md                  ← 5-minute setup

📦 STEP 2: Download These 13 Files (in order)

ROOT LEVEL (6 files):
├─ 01_package.json                 ← NPM dependencies
├─ 02_.env.example                 ← Environment template
├─ 03_.gitignore                   ← Git ignore
├─ 04_Dockerfile                   ← Docker image
├─ 05_index.html                   ← Main HTML entry
└─ 06_server.js                    ← Express backend

src/ LEVEL (2 files):
├─ 07_config-manager.js            ← Config loader
└─ 08_dashboard-router.js          ← Route handler

src/styles/ LEVEL (1 file):
└─ 09_theme.css                    ← Theme & typography

src/components/ LEVEL (3 files):
├─ 10_base.js                      ← Component base class
├─ 11_time-display.js              ← Time component
└─ 12_weather.js                   ← Weather component

src/dashboards/ LEVEL (1 file):
└─ 13_morning.js                   ← Morning layout

📄 BONUS (Documentation):
├─ PHASE_1_COMPLETION_SUMMARY.md   ← Detailed overview
├─ dashboard-rebuild/              ← Full folder (optional backup)
└─ [other strategy docs]           ← Reference only
```

---

## How to Set It Up

### Step 1: Create Folder Structure

On your computer, create these folders:

```bash
# Navigate to where you want the project
cd ~/projects
# or wherever you keep code

# Create main project folder
mkdir my-dashboards
cd my-dashboards

# Create subfolders
mkdir -p src/components
mkdir -p src/dashboards
mkdir -p src/styles
```

### Step 2: Download the 13 Files

Download all files with numbers (01_ through 13_) from outputs.

### Step 3: Place Files in Folders

```
my-dashboards/                          ← Your main folder
├── package.json                        ← 01_package.json (remove "01_" part)
├── .env.example                        ← 02_.env.example
├── .gitignore                          ← 03_.gitignore
├── Dockerfile                          ← 04_Dockerfile
├── index.html                          ← 05_index.html
├── server.js                           ← 06_server.js
├── README.md                           ← (copy from outputs too, not numbered)
│
└── src/
    ├── config-manager.js               ← 07_config-manager.js
    ├── dashboard-router.js             ← 08_dashboard-router.js
    │
    ├── components/
    │   ├── base.js                     ← 10_base.js
    │   ├── time-display.js             ← 11_time-display.js
    │   └── weather.js                  ← 12_weather.js
    │
    ├── dashboards/
    │   └── morning.js                  ← 13_morning.js
    │
    └── styles/
        └── theme.css                   ← 09_theme.css
```

### Step 4: Setup Environment

```bash
cd my-dashboards

# Copy the template
cp .env.example .env

# Edit with your credentials
nano .env        # or use your favorite editor

# You need to fill in:
# VITE_OPENWEATHERMAP_API_KEY=...
# VITE_NEXTCLOUD_PASSWORD=...
# VITE_PROMETHEUS_URL=...
```

### Step 5: Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# You should see:
# ╔════════════════════════════════════════════╗
# ║    Dawnfire Dashboard Server Started       ║
# ╚════════════════════════════════════════════╝
# 
# Environment: development
# Port: 3000
# URL: http://localhost:3000
```

### Step 6: Test in Browser

```
http://localhost:3000?dashboard=morning
```

You should see:
- Large PST time (updating every second)
- Date above it
- EST time below
- Weather section
- Calendar section
- Morning tasks
- Infrastructure placeholder

---

## File Renaming Reference

When you download, the files have numbers for organization. You need to remove those numbers:

| Download Name | Rename To | Location |
|---|---|---|
| 01_package.json | package.json | root |
| 02_.env.example | .env.example | root |
| 03_.gitignore | .gitignore | root |
| 04_Dockerfile | Dockerfile | root |
| 05_index.html | index.html | root |
| 06_server.js | server.js | root |
| 07_config-manager.js | config-manager.js | src/ |
| 08_dashboard-router.js | dashboard-router.js | src/ |
| 09_theme.css | theme.css | src/styles/ |
| 10_base.js | base.js | src/components/ |
| 11_time-display.js | time-display.js | src/components/ |
| 12_weather.js | weather.js | src/components/ |
| 13_morning.js | morning.js | src/dashboards/ |

---

## Folder Structure Verification

After placing all files, your structure should look exactly like this:

```bash
$ tree my-dashboards/
my-dashboards/
├── .env.example
├── .gitignore
├── Dockerfile
├── README.md
├── index.html
├── package.json
├── server.js
└── src/
    ├── config-manager.js
    ├── dashboard-router.js
    ├── components/
    │   ├── base.js
    │   ├── time-display.js
    │   └── weather.js
    ├── dashboards/
    │   └── morning.js
    └── styles/
        └── theme.css

# Count: 14 files, 4 directories (excluding hidden files like .git)
```

You can verify with:
```bash
cd my-dashboards
find . -type f | wc -l   # Should say 14
find . -type d | wc -l   # Should say 5 (including . and src itself)
```

---

## Quick Check

Before running `npm install`, verify all files are in place:

```bash
# From my-dashboards/ directory:

# Root files (should list 6):
ls -1 *.json *.html *.js Dockerfile .* 2>/dev/null | grep -v "^\\."

# src files (should list 2):
ls -1 src/*.js

# Component files (should list 3):
ls -1 src/components/*.js

# Style files (should list 1):
ls -1 src/styles/*.css

# Dashboard files (should list 1):
ls -1 src/dashboards/*.js
```

---

## Troubleshooting

**"Cannot find module 'express'"**
→ Run `npm install`

**"ENOENT: no such file or directory, open './.env'"**
→ You forgot to create .env. Run: `cp .env.example .env`

**"Missing required environment variable"**
→ Edit .env and fill in your API keys

**"File not found" errors when starting server**
→ Check that files are renamed correctly (no "01_" prefixes left)

**"SyntaxError in src/components/base.js"**
→ Make sure file was copied completely (not truncated)

---

## Download Checklist

✅ Download DIRECTORY_STRUCTURE.md (visual reference)  
✅ Download FILE_INDEX.md (what each file does)  
✅ Download all 13 numbered files (01_ through 13_)  
✅ Download QUICK_START.md (5-minute guide)  
✅ Download README.md (full documentation)  

Then:
✅ Create folders on your machine  
✅ Place downloaded files in correct folders (removing numbers)  
✅ `cp .env.example .env` and edit with credentials  
✅ `npm install`  
✅ `npm run dev`  
✅ Open http://localhost:3000?dashboard=morning  

---

## Ready?

1. **Read:** DIRECTORY_STRUCTURE.md
2. **Create:** Folders on your machine
3. **Download:** 13 numbered files
4. **Place:** Files according to folder structure
5. **Setup:** .env file with credentials
6. **Run:** `npm install && npm run dev`
7. **Test:** http://localhost:3000?dashboard=morning

You've got this! 🚀