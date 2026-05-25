# App Store Submission Guide

Plan: **dziś** = Apple Dev enrollment + Vercel deploy. **Jutro/pojutrze** = TestFlight (do 100 testerów). **Za 4-7 dni** = publiczna App Store.

---

## ⚠️ Realne timing

| Krok | Czas |
|---|---|
| Apple Developer Program enrollment | 24–48h verification ($99/rok) |
| Vercel deploy (produkcja) | 15 min |
| Apple Sign-In setup w Apple Dev portal | 20 min (po enrollment) |
| Xcode install | 30–60 min (~7GB) |
| Capacitor build + Xcode konfiguracja | 2–3h |
| Upload do App Store Connect | 30 min |
| TestFlight processing | 30–60 min |
| **TestFlight Internal Testing — 100 osób może zainstalować** | **dostępne natychmiast po upload** |
| App Store review (pierwszy submit) | 24–72h, do 7 dni |

---

## Krok 1 — Apple Developer enrollment (zacznij TERAZ, czeka 24–48h)

1. [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll)
2. Zaloguj swoim Apple ID (najlepiej tym z prawdziwym imieniem i nazwiskiem)
3. Włącz **2FA** w Apple ID jeśli jeszcze nie masz
4. **Individual** (dla pojedynczego dewelopera) lub **Organization** (jeśli LLC/Sp. z o.o.)
5. Płatność $99/rok kartą
6. Apple weryfikuje (24–48h dla individual, dłużej dla org)

Gdy enrollment przejdzie:
- Otrzymasz dostęp do [developer.apple.com/account](https://developer.apple.com/account)
- W zakładce **Membership** zobaczysz **Team ID** (10 znaków) — będzie potrzebny

---

## Krok 2 — Vercel deploy (zrób TERAZ równolegle z Apple enrollment)

Apka musi być na publicznym URL przed Capacitor — webview będzie ładował Vercel.

1. [vercel.com/signup](https://vercel.com/signup) → przez GitHub
2. **Wrzuć kod do GitHub repo** (jeśli jeszcze nie):
   ```bash
   cd "/Users/jd/Desktop/Projekty Claude/Kcaler"
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create kcal-tracker --private --source=. --push
   ```
3. Vercel → **New Project** → Import z GitHub → wybierz `kcal-tracker`
4. **Environment Variables** — wpisz wszystkie z `.env.local`:
   ```
   DATABASE_URL         (twój Neon connection string)
   AUTH_SECRET          (z .env.local)
   NEXTAUTH_URL         https://kcal-tracker.vercel.app   ← UWAGA: produkcyjny URL!
   GOOGLE_CLIENT_ID     (z Google Cloud)
   GOOGLE_CLIENT_SECRET (z Google Cloud)
   ANTHROPIC_API_KEY    (z Anthropic Console)
   ```
   (Apple env vars dodasz później po Apple enrollment)
5. **Deploy** → po ~2 minutach masz produkcyjny URL

6. **Wróć do Google Cloud Console** → Credentials → swój OAuth client → **Authorized redirect URIs** dodaj:
   ```
   https://kcal-tracker.vercel.app/api/auth/callback/google
   ```

7. **Sprawdź że produkcja działa:** zaloguj się przez Google na produkcyjnym URL.

---

## Krok 3 — Apple Sign-In setup (po enrollment)

1. [developer.apple.com/account/resources/identifiers](https://developer.apple.com/account/resources/identifiers)

### 3a) App ID
- **+** → **App IDs** → **App** → Continue
- Bundle ID: **Explicit** → `com.kcal.tracker`
- Description: `Kcal Tracker`
- Capabilities → zaznacz **Sign In with Apple**
- Continue → Register

### 3b) Services ID (dla Sign In with Apple z webu)
- **+** → **Services IDs** → Continue
- Description: `Kcal Tracker Sign-In`
- Identifier: `com.kcal.tracker.signin` (musi być **inny** niż App ID)
- Continue → Register
- **Edit** services ID → włącz **Sign In with Apple** → **Configure**:
  - Primary App ID: `com.kcal.tracker`
  - Domains: `kcal-tracker.vercel.app`
  - Return URLs: `https://kcal-tracker.vercel.app/api/auth/callback/apple`
  - Save → Continue → Save

### 3c) Key (private .p8 file)
- [developer.apple.com/account/resources/authkeys](https://developer.apple.com/account/resources/authkeys)
- **+** → Key Name: `Kcal Tracker Sign-In Key`
- Zaznacz **Sign In with Apple** → Configure → Primary App ID: `com.kcal.tracker` → Save
- Continue → Register → **Download** (.p8 file)
- **TYLKO RAZ MOŻNA POBRAĆ — zapisz w bezpiecznym miejscu**
- Zapamiętaj **Key ID** (10 znaków) widoczny obok klucza

### 3d) Konfiguracja w `.env.local`
```bash
APPLE_TEAM_ID=ABCDEF1234           # z Membership
APPLE_KEY_ID=ABCDEF1234            # z Key ID
APPLE_CLIENT_ID=com.kcal.tracker.signin
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGTAg...\n-----END PRIVATE KEY-----"
```
**Uwaga**: `APPLE_PRIVATE_KEY` musi mieć `\n` zachowane jako string literal w `.env.local`.

### 3e) Wygeneruj APPLE_CLIENT_SECRET (JWT podpisany .p8)
```bash
npm run apple:secret
# Skopiuj wyjście do APPLE_CLIENT_SECRET w .env.local
```
Token ważny 6 miesięcy. **Trzeba odnawiać** przed wygaśnięciem (postaw cron na Vercel albo ręcznie).

### 3f) Dodaj wszystkie APPLE_* do Vercel env vars i zrób redeploy.

---

## Krok 4 — Xcode + Capacitor (po Apple enrollment)

### 4a) Install
```bash
# Xcode z Mac App Store (~7GB, ~30-60 min)
# albo: xcode-select --install (lżejsza wersja CommandLineTools, NIE wystarczy do App Store)

# CocoaPods (potrzebne przez Capacitor)
brew install cocoapods
# albo: sudo gem install cocoapods
```

### 4b) Build webu (placeholder folder pełni rolę webDir — Capacitor i tak będzie ładował remote URL)
```bash
cd "/Users/jd/Desktop/Projekty Claude/Kcaler"
# capacitor-www już istnieje z placeholder index.html
```

### 4c) Update capacitor.config.ts
Otwórz [capacitor.config.ts](capacitor.config.ts) i odkomentuj:
```ts
server: {
  url: 'https://kcal-tracker.vercel.app',  // ← podstaw produkcyjny URL
  androidScheme: 'https',
  iosScheme: 'https',
},
```

### 4d) Dodaj platformę iOS
```bash
npx cap add ios
npx cap sync
```
To tworzy folder `ios/` z native projektem.

### 4e) Wgraj ikony
- Otwórz `ios/App/App/Assets.xcassets/AppIcon.appiconset/` w Finder
- Skopiuj wszystko z `ios-assets/AppIcon.appiconset/*` do tego folderu (włącznie z `Contents.json`)
- Otwórz `ios/App/App/Assets.xcassets/Splash.imageset/` i skopiuj z `ios-assets/Splash.imageset/*`

### 4f) Open in Xcode
```bash
npx cap open ios
```

### 4g) W Xcode skonfiguruj:
- **TARGETS → App → Signing & Capabilities**:
  - Team: wybierz swój Apple Developer Team
  - Bundle Identifier: `com.kcal.tracker` (musi pasować do App ID)
  - **+ Capability** → **Sign In with Apple** (klik raz)
  - **+ Capability** → **Associated Domains** → dodaj `applinks:kcal-tracker.vercel.app` (dla Sign In with Apple deep link)
- **General → Identity**:
  - Display Name: `Kcal Tracker`
  - Version: `1.0.0`
  - Build: `1`
- **General → Deployment Info**:
  - Minimum iOS: `15.0`
  - iPhone Orientation: tylko **Portrait**
- **Info.plist → Privacy Strings** (Xcode podpowie automatycznie gdy brakuje):
  - `NSCameraUsageDescription`: "Aplikacja używa kamery do skanowania etykiet produktów."
  - `NSPhotoLibraryUsageDescription`: "Aplikacja korzysta z biblioteki zdjęć do wybrania zdjęcia etykiety."

### 4h) Test w symulatorze
- Wybierz iPhone 15 w toolbar Xcode
- Cmd+R → app powinna się uruchomić w simulatorze, ładując produkcyjny URL

### 4i) Test na realnym iPhone
- Podłącz iPhone kablem
- Wybierz urządzenie w Xcode → Cmd+R
- W iPhone Settings → General → VPN & Device Management → zaufaj developerowi

---

## Krok 5 — App Store Connect

### 5a) Stwórz app record
1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → Apps → **+**
2. Platform: iOS
3. Name: `Kcal Tracker`
4. Primary Language: Polish (Poland)
5. Bundle ID: `com.kcal.tracker`
6. SKU: `kcal-tracker-001` (dowolne, unikalne)
7. Create

### 5b) App Information
- **Privacy Policy URL**: `https://kcal-tracker.vercel.app/privacy`
- **Category**: Health & Fitness
- **Content Rights**: brak third-party content (chyba że uważasz inaczej)

### 5c) Pricing and Availability
- Free
- Available in all territories (lub tylko Poland — twoja decyzja)

### 5d) App Privacy
Wypełnij ankietę — co aplikacja zbiera:
- **Contact Info**: Email Address (Used for Account, Linked to user)
- **Identifiers**: User ID (Used for Account)
- **Health & Fitness**: Health/Fitness Data (Used for App Functionality, Linked to user) — bo waga/wzrost/cele kaloryczne
- **Tracking**: NO (nie używamy tracking)

### 5e) Version 1.0 Prepare for Submission
- **Screenshots**: wymagane co najmniej 1 zestaw dla **iPhone 6.9"** (1290×2796px). Zrób screeny w Xcode Simulator: Device → iPhone 15 Pro Max → uruchom app → Cmd+S
- **Description** (PL):
  > Kcal Tracker — szybkie liczenie kalorii i makroskładników. Skanuj etykiety produktów aparatem (Claude Vision). Dodawaj posiłki w 3 tapach. Działa offline. Po polsku.
  >
  > Funkcje:
  > • Pierścień postępu kcal + 3 makro (białko/tłuszcz/węgle)
  > • 185 polskich produktów w bazie + własne
  > • Skanowanie etykiet kamerą
  > • Historia tygodniowa i miesięczna
  > • Streak counter — dni z rzędu z wpisami
  > • Tryby diet: zbilansowana, niskowęglowodanowa, keto, wysokobiałkowa
  > • Bez reklam, bez analytics, dane lokalnie + bezpieczna chmura
- **Keywords**: `kalorie,dieta,makro,jedzenie,zdrowie,fitness,waga`
- **Support URL**: `mailto:hello@kcal-tracker.app` (lub URL strony wsparcia)
- **Marketing URL** (opcjonalne)

### 5f) Build
- Po Cmd+B w Xcode → **Product → Archive**
- Po archive → **Distribute App** → **App Store Connect** → **Upload**
- Czekaj na processing w App Store Connect (~10-30 min)
- Wróć do strony Version 1.0 → wybierz upload jako Build

### 5g) Submit for Review
- Sprawdź wszystko → **Submit for Review**
- Status: **Waiting for Review** → **In Review** → **Approved** lub **Rejected**

---

## Krok 6 — TestFlight (testowanie zanim public)

Najszybsza ścieżka żeby ktoś mógł zainstalować:

1. App Store Connect → twoja app → **TestFlight**
2. Po upload buildu (5e) automatycznie pojawi się w TestFlight
3. **Internal Testing** → dodaj testerów (do 100 — wystarczy email Apple ID każdej osoby)
4. Każdy tester dostaje email → instaluje TestFlight app z App Store → otwiera link → instaluje twoją app
5. Builds w TestFlight żyją 90 dni

**To jedyna realna ścieżka żeby ktoś inny mógł pobrać aplikację dziś-jutro** (bez czekania na review).

---

## Apple wymagania na które musisz uważać

❗ **Sign In with Apple jest WYMAGANE jeśli oferujesz inne OAuth (Google).** Apple może odrzucić submita jeśli pokazujesz tylko Google. ✅ Już mamy oba.

❗ **Aplikacja używająca tylko webview może zostać odrzucona** jako "thin wrapper". Mitigation:
- Capacitor configure: `iosScheme: 'https'` ✅
- Dodajemy iOS-specific features (push notifications byłoby plus, ale na pierwszy submit nie konieczne)
- Native splash screen ✅
- Native ikony ✅
- Privacy strings ✅

❗ **Privacy Policy URL musi działać** ✅ `/privacy` route gotowy.

❗ **Health data** wymaga prywatność description jeśli używamy HealthKit. **Nie używamy** (tylko ręczny wpis wagi). OK.

---

## Co jeszcze możesz wziąć na kolejne wersje

- **Apple Sign-In z natywnego SDK** (zamiast webowego flow) — wygodniejsze na iOS
- **HealthKit integration** — sync wagi z appem Zdrowie
- **Push notifications** — przypomnienia o posiłkach
- **Widget na ekranie głównym** — szybki tap = dodaj
- **Shortcuts** — `Hej Siri, dodaj jabłko`
