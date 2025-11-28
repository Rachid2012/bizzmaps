# 🚀 BizMapper - Vercel Deployment Guide

## ✅ Preparation Complete!

Your repository is ready for deployment. All files have been created and committed to Git.

---

## 📋 Next Steps

### Step 1: Create GitHub Repository

1. Go to **https://github.com/new**
2. Fill in the details:
   - **Repository name:** `bizmapper`
   - **Description:** "Local Business Discovery Platform with Secure API"
   - **Visibility:** Public or Private (your choice)
   - **DO NOT** check "Initialize this repository with a README"
3. Click **"Create repository"**

### Step 2: Push Code to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
git remote add origin https://github.com/YOUR_USERNAME/bizmapper.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

Run these commands in PowerShell:

```powershell
cd "c:\Users\El-Patron\Desktop\business map"

# Add your GitHub repository (REPLACE YOUR_USERNAME!)
git remote add origin https://github.com/YOUR_USERNAME/bizmapper.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

---

### Step 3: Deploy to Vercel

1. Go to **https://vercel.com**
2. Sign in (use GitHub account for easy integration)
3. Click **"Add New Project"** or **"Import Project"**
4. Select **"Import Git Repository"**
5. Find and select your **`bizmapper`** repository
6. Click **"Import"**

### Step 4: Configure Environment Variable

**BEFORE clicking Deploy:**

1. In the Vercel import screen, find **"Environment Variables"** section
2. Click **"Add"** or expand the section
3. Add this variable:
   - **Name:** `GOOGLE_MAPS_API_KEY`
   - **Value:** `AIzaSyCYiKxSSK7pKyN-5rElpKDTLlkyJ4-9SJ8`
   - **Environment:** Select all (Production, Preview, Development)
4. Click **"Add"**

### Step 5: Deploy!

1. Click **"Deploy"**
2. Wait 1-2 minutes for deployment to complete
3. You'll see a success screen with your live URL!

---

## 🔒 Secure Your API Key (Important!)

After deployment, restrict your Google Maps API key:

1. Go to **https://console.cloud.google.com/**
2. Navigate to: **APIs & Services → Credentials**
3. Click on your API key
4. Under **"Application restrictions"**:
   - Select **"HTTP referrers (web sites)"**
   - Click **"Add an item"**
   - Add: `https://your-app-name.vercel.app/*` (use your actual Vercel URL)
   - Add: `https://*.vercel.app/*` (for preview deployments)
5. Click **"Save"**

---

## ✅ Verification Checklist

After deployment, test these features:

- [ ] Open your Vercel URL
- [ ] Check browser console - API key should NOT be visible
- [ ] Verify 3D map loads with purple radius circle
- [ ] Test city autocomplete dropdown
- [ ] Perform a business search
- [ ] Click "Proposal" on a business
- [ ] Test "Copy Email" button
- [ ] Test "Download" button
- [ ] Click "Export" to download CSV
- [ ] Check mobile responsiveness

---

## 🎯 Your Deployment URLs

After deployment, you'll get:

- **Production:** `https://your-app-name.vercel.app`
- **Preview:** Automatic preview URLs for each git push
- **Dashboard:** `https://vercel.com/dashboard`

---

## 🔄 Future Updates

Every time you push to GitHub, Vercel automatically deploys:

```bash
# Make changes to your code
git add .
git commit -m "Your update message"
git push

# Vercel automatically deploys! ✨
```

---

## 🆘 Troubleshooting

### If map doesn't load:
1. Check Vercel dashboard → Environment Variables
2. Verify `GOOGLE_MAPS_API_KEY` is set correctly
3. Check browser console for errors

### If deployment fails:
1. Check Vercel deployment logs
2. Verify all files are committed to Git
3. Ensure `vercel.json` is present

### If API key is exposed:
1. The key should NOT appear in browser source
2. Check `/api/maps-config` endpoint
3. Verify serverless function is working

---

## 📞 Need Help?

If you encounter any issues:
1. Check Vercel deployment logs
2. Verify environment variables are set
3. Test the `/api/maps-config` endpoint
4. Check browser console for errors

---

## 🎉 Success!

Once deployed, your BizMapper app will be:
- ✅ Live on the internet
- ✅ Secured with HTTPS
- ✅ API key hidden from users
- ✅ Automatically deployed on every push
- ✅ Globally distributed via CDN

**Share your live URL and start discovering businesses!** 🚀
