# Efi — Google Play Release Checklist

Everything below is a one-time setup. Once done, future updates are just steps 3 and 6.

---

## Prerequisites (do these when ready)

- [ ] Buy domain (efi.app or similar)
- [ ] Pay Google Play Developer account ($25 one-time) at play.google.com/console
- [ ] Install Android Studio

---

## Step 1 — Generate a signing keystore (one time only)

Run this command from the repo root. Keep the keystore file and passwords safe — if you lose them you cannot update the app on the Play Store.

```bash
keytool -genkey -v \
  -keystore efi-release.keystore \
  -alias efi \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Store `efi-release.keystore` somewhere safe (NOT in git — it's already in .gitignore).

---

## Step 2 — Configure signing in Android Studio

1. Open Android Studio → Open project → select the `android/` folder
2. Go to **Build > Generate Signed Bundle / APK**
3. Choose **Android App Bundle (AAB)** (required by Play Store)
4. Point to your `efi-release.keystore`, enter alias `efi` and your passwords
5. Select **release** build variant
6. Click Finish — Android Studio outputs the `.aab` file

---

## Step 3 — Build and sync before each release

```bash
npm run cap:sync
```

This rebuilds the frontend and syncs it into the Android project. Always run this before building in Android Studio.

---

## Step 4 — Create Play Store listing (one time)

In Google Play Console:
- App name: **Efi**
- Short description: CRM personal para freelancers y creadores independientes
- Full description: (write a paragraph about the app)
- Category: **Business**
- Screenshots: at least 2 phone screenshots (take them from Android Studio emulator)
- Feature graphic: 1024x500px banner image
- Privacy policy URL: required — host a simple one at your domain

---

## Step 5 — Upload first AAB

In Google Play Console → Production → Create new release → Upload the `.aab` file.

Set version name to `1.0` (matches `versionName` in `android/app/build.gradle`).

---

## Step 6 — Future updates

1. `npm run cap:sync` — rebuild and sync
2. Bump `versionCode` and `versionName` in `android/app/build.gradle`
3. Build signed AAB in Android Studio
4. Upload to Play Console → create new release

---

## iOS (future — needs Mac + Apple Developer account $99/year)

- Apple Developer account: developer.apple.com
- Needs Xcode on a Mac (can use a cloud Mac service like MacStadium or GitHub Actions)
- Run `npm run cap:ios` to open the Xcode project
- Same sync flow: `npm run cap:sync` before each build
