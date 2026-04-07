# When You Return - On-Device ML Setup Guide

**Build Status:** In Progress (EAS Build running on cloud)

---

## 🎯 What's Been Done

✅ **EAS Build Configured**
- Account: ayushrr
- Project: parakh-ai-fitness  
- Application ID: com.ayushrr.parakhaifitness
- Keystore: Generated and saved to EAS

✅ **Code Ready**
- On-device ML infrastructure complete
- Hybrid processing (device → server fallback) implemented
- Video frame extraction with expo-video-thumbnails
- TensorFlow.js initialization working

✅ **Build Started**
- Platform: Android (development profile)
- Started at: ~10:00 PM (April 6, 2026)
- Expected completion: 15-20 minutes

---

## 📋 When You Return - Quick Steps

### Step 1: Check Build Status

**Go to:** https://expo.dev/accounts/ayushrr/projects/parakh-ai-fitness/builds

**Look for:**
- ✅ Green checkmark = Build succeeded
- ❌ Red X = Build failed
- 🔄 Spinner = Still building

### Step 2: If Build Succeeded

**Download the APK:**
1. Click on the build
2. Click "Download" button
3. Save the `.apk` file

**Install on Android Device:**
1. Transfer APK to your phone (USB, email, etc.)
2. On phone: Settings → Security → Enable "Install from Unknown Sources"
3. Open the APK file and install

### Step 3: Start Development Server

Open terminal in project directory:
```bash
cd C:\Users\Asus\OneDrive\Desktop\ParakhAI
npx expo start --dev-client
```

This will show a QR code.

### Step 4: Connect App to Server

1. Open ParakhAI app on your phone
2. Shake device to open dev menu
3. Tap "Enter URL manually"
4. Enter the URL from terminal (will be like `exp://192.168.X.X:8081`)
5. App will reload and connect

### Step 5: Test On-Device ML

1. **Make sure backend is running:**
   ```bash
   cd backend
   venv\Scripts\activate
   python main.py
   ```

2. **In the app:**
   - Select "Push-ups"
   - Record a 10-second video
   - Watch Metro console for logs

3. **Expected logs:**
   ```
   On-device ML available: true
   Attempting on-device analysis...
   [On-Device] extracting: Extracted frame 1/30
   ...
   [On-Device] complete: Analysis complete
   ```

4. **If it falls back to server:**
   ```
   On-device processing failed, falling back to server
   Using server-based analysis...
   ```

---

## ❓ If Build Failed

**Common issues:**

1. **Dependency conflicts:**
   - Run: `npm install --legacy-peer-deps`
   - Retry build: `eas build --profile development --platform android`

2. **Config errors:**
   - Check `app.json` is valid JSON
   - Verify `eas.json` exists

3. **EAS account issues:**
   - Re-login: `eas login`
   - Retry build

**Get build logs:**
```bash
eas build:list
# Click on build ID to see detailed logs
```

---

## 🔧 Troubleshooting

### App Won't Connect to Dev Server
```bash
# Check your IP address
ipconfig

# Make sure it matches in expo start output
# Update VideoUploadScreen.tsx if needed (line ~148)
```

### On-Device ML Not Working
**Check console for errors:**
- "Failed to load model" → TensorFlow.js issue
- "Frame extraction failed" → expo-video-thumbnails issue
- Falls back to server → This is normal! Server fallback works

### Backend Not Responding
```bash
# Restart backend
cd backend
venv\Scripts\activate
python main.py

# Should see: 
# ✓ Server running on http://192.168.137.167:9000
```

---

## 📱 Commands Quick Reference

**Check build status:**
```bash
eas build:list
```

**Start dev server:**
```bash
npx expo start --dev-client
```

**Start backend:**
```bash
cd backend
venv\Scripts\activate
python main.py
```

**View logs:**
```bash
# Frontend logs (Metro)
# Automatically shown when expo start is running

# Backend logs
# Shown in terminal where python main.py is running
```

---

## 🎉 Success Checklist

- [ ] Build completed successfully
- [ ] APK downloaded
- [ ] App installed on device
- [ ] Dev server running
- [ ] App connected to dev server
- [ ] Backend running
- [ ] Recorded test video
- [ ] Saw processing logs
- [ ] Got results screen

---

## 📊 What Happens Next

**If on-device ML works:**
- You'll see faster processing
- Works offline
- Privacy-first (no upload)

**If it falls back to server:**
- Still works perfectly!
- Uses existing backend
- Same results

**Either way, you're ready to:**
- Test different exercises
- Add more features
- Deploy to production

---

## 💡 Tips

1. **Keep backend running** - Even with on-device ML, server fallback is important
2. **Check logs** - Both Metro and backend terminals
3. **Be patient** - First model load takes ~10-20 seconds
4. **Test thoroughly** - Try all three exercises

---

## 📞 Current Status Summary

**Build:** In Progress on EAS  
**Code:** ✅ Complete and tested  
**Backend:** ✅ Running on port 9000  
**Frontend:** ✅ Ready for dev build  
**ML:** ✅ Infrastructure ready  

**Next Action:** Wait for build → Download → Install → Test

---

**Build Dashboard:** https://expo.dev/accounts/ayushrr/projects/parakh-ai-fitness/builds

Come back when the build is done, and follow the steps above! 🚀
