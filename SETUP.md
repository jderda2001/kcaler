# Setup — Kcal Tracker

Aplikacja używa **Neon Postgres** (DB), **Auth.js v5** (auth) i **Google OAuth**. Wszystko jest na darmowych tierach.

## 1. Neon Postgres (baza danych)

1. Wejdź na [console.neon.tech](https://console.neon.tech) → zaloguj się (Google ok)
2. Create Project: nazwa `kcal-tracker`, region najbliższy (np. `Frankfurt eu-central-1`)
3. Po utworzeniu → **Dashboard** → **Connection Details** → wybierz **Pooled connection**
4. Skopiuj `DATABASE_URL` (string `postgresql://...sslmode=require`)
5. Wklej do `.env.local`:
   ```
   DATABASE_URL=postgresql://...
   ```

**Uwaga**: Neon free tier wybudza projekt po inaktywności — pierwszy request po przerwie może chwilę trwać, kolejne są instant.

## 2. Inicjalizacja schematu bazy

W root projektu:

```bash
npm run db:push
```

To utworzy wszystkie tabele (users, accounts, sessions, profiles, foods, log_entries) w Twojej bazie Neon.

Możesz zobaczyć w GUI:
```bash
npm run db:studio
```

## 3. Google OAuth

1. [console.cloud.google.com](https://console.cloud.google.com) → utwórz projekt `Kcal Tracker`
2. APIs & Services → **OAuth consent screen**:
   - User type: **External**
   - App name: `Kcal Tracker`
   - User support email: Twój
   - Scopes: pozostaw default (`email`, `profile`, `openid`)
   - Test users: dodaj swój email (do czasu publikacji)
3. APIs & Services → **Credentials** → **Create Credentials → OAuth client ID**:
   - Type: **Web application**
   - Name: `Kcal Tracker Web`
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://twoja-domena.com` (gdy będziesz miał produkcję)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://twoja-domena.com/api/auth/callback/google`
4. Skopiuj **Client ID** i **Client Secret** do `.env.local`:
   ```
   GOOGLE_CLIENT_ID=...apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-...
   ```

## 4. Auth secret

Wygeneruj losowy secret dla podpisywania JWT:

```bash
openssl rand -base64 32
```

Wklej do `.env.local`:
```
AUTH_SECRET=...
```

## 5. Uruchomienie

```bash
cp .env.local.example .env.local
# wypełnij wszystkie zmienne
npm run db:push
npm run dev
```

Otwórz `http://localhost:3000` → przekieruje na `/login`.

## 6. Deploy na Vercel

1. [vercel.com](https://vercel.com) → New Project → import z GitHub
2. Framework: Next.js (auto-detect)
3. Environment Variables — dodaj wszystkie z `.env.local`:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` → `https://twoja-domena.vercel.app`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `ANTHROPIC_API_KEY`
4. Po deployu **wróć do Google OAuth Credentials** i dodaj produkcyjny URL do Authorized origins/redirects
5. **Wróć do Neon** i sprawdź że `DATABASE_URL` na Vercel jest pooled connection (ważne na serverless)

## 7. iOS (Capacitor) — przyszła sesja

Wymaga macOS + Xcode + Apple Developer Account ($99/rok). Plan:
1. `npm install @capacitor/core @capacitor/cli @capacitor/ios`
2. `npx cap init "Kcal Tracker" com.twojadomena.kcal`
3. `npm run build && npm run export` → static export
4. `npx cap add ios && npx cap sync`
5. Otwórz `ios/App/App.xcworkspace` w Xcode, podpisz, archive, upload do App Store Connect.

**Uwaga**: Apple wymaga **Apple Sign-In** jako alternatywy gdy oferujesz Google Sign-In. Auth.js ma provider `Apple` — dodamy przy submisji.

## 8. Sync IndexedDB ↔ Postgres — przyszła sesja

Obecnie każde urządzenie ma osobny IndexedDB. Plan synchronizacji:
- Mutacje lokalnie → kolejka w IndexedDB → push API na server
- Na uruchomienie → pull zmian od last_sync_at → merge do IndexedDB (last-write-wins)
- Conflict resolution: server timestamp wins

To ~5h pracy, zrobimy w osobnej iteracji.
