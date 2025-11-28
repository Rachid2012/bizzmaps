# Quick Deployment Commands

## 🔗 Connect to GitHub

**IMPORTANT: Replace YOUR_USERNAME with your actual GitHub username!**

```powershell
# Navigate to project
cd "c:\Users\El-Patron\Desktop\business map"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/bizmapper.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

## 📝 Example (if your username is "john"):

```powershell
git remote add origin https://github.com/john/bizmapper.git
git branch -M main
git push -u origin main
```

---

## ⚙️ Vercel Environment Variable

When deploying on Vercel, add this environment variable:

**Name:** `GOOGLE_MAPS_API_KEY`  
**Value:** `AIzaSyCYiKxSSK7pKyN-5rElpKDTLlkyJ4-9SJ8`

---

## 🌐 After Deployment

Restrict API key at: https://console.cloud.google.com/

Add these referrers:
- `https://your-app-name.vercel.app/*`
- `https://*.vercel.app/*`

---

That's it! Your app will be live in minutes! 🚀
