# How to Configure YouTube Cookies for AnyDownload

To bypass YouTube's "Sign in to confirm you're not a bot" errors in serverless environments (like Vercel), you need to provide authenticated cookies.

## Prerequisites
- A desktop browser (Chrome/Firefox)
- A "Get cookies.txt" extension. Recommended: **"Get cookies.txt LOCALLY"** (Chrome/Firefox)
- A YouTube account (Recommended: Use a throwaway/secondary account to protect your main account)

## Step-by-Step Guide

### 1. Export Cookies from Browser
1. Open your browser and go to **[YouTube.com](https://www.youtube.com)**.
2. **Log in** to your secondary Google/YouTube account.
3. Click the **"Get cookies.txt LOCALLY"** extension icon in your toolbar.
4. Click **"Export"** (ensure it says "Netscape HTTP Cookie File" or similar).
5. A file named `cookies.txt` (or similar) will be downloaded.

### 2. Copy Cookie Content
1. Open the downloaded `cookies.txt` file with a plain text editor (Notepad, TextEdit, VS Code).
2. Select **ALL** text (`Cmd+A` or `Ctrl+A`).
3. **Copy** the content (`Cmd+C` or `Ctrl+C`).
   - *It should look like lines of text starting with `# Netscape HTTP Cookie File` or `.youtube.com ...`*

### 3. Configure Vercel Environment Variable
1. Go to your **Vercel Dashboard**.
2. Select your **AnyDownload** project.
3. Click on the **Settings** tab.
4. Click on **Environment Variables** in the left sidebar.
5. Add a new variable:
   - **Key**: `YOUTUBE_COOKIES`
   - **Value**: [PASTE THE COPIED COOKIE CONTENT HERE]
6. Click **Save**.

### 4. Redeploy
1. Validating Environment Variables usually requires a redeployment.
2. Go to the **Deployments** tab.
3. Click the **three dots** (...) on your latest deployment -> **Redeploy**.
4. Once active, the app will use these cookies to authenticate requests, bypassing the bot check.

## Troubleshooting
- **Cookies Expire**: If downloads stop working after a few months, repeat this process to get fresh cookies.
- **Invalid Format**: Ensure you copied the *raw text* from the file, not the file path.
