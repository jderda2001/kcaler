export const metadata = {
  title: 'Polityka prywatności · Kcal Tracker',
};

export default function PrivacyPage() {
  return (
    <article className="prose max-w-none">
      <h1 className="text-3xl font-semibold tracking-tight">Polityka prywatności</h1>
      <p className="text-muted-foreground mt-1 text-sm">Ostatnia aktualizacja: 2026-05-25</p>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">Jakie dane zbieramy</h2>
        <p className="text-sm leading-relaxed">
          Kcal Tracker zbiera następujące dane potrzebne do działania usługi:
        </p>
        <ul className="space-y-2 text-sm leading-relaxed">
          <li>
            <strong>Konto:</strong> adres email i imię (jeśli podany przy rejestracji lub
            pochodzą z dostawcy OAuth — Google/Apple). Hash hasła jeśli rejestrujesz się
            przez email.
          </li>
          <li>
            <strong>Profil żywieniowy:</strong> wiek, płeć, wzrost, waga, poziom aktywności,
            cel kaloryczny. Te dane wprowadzasz dobrowolnie podczas onboardingu.
          </li>
          <li>
            <strong>Wpisy żywieniowe:</strong> produkty, ilości i daty spożycia jakie
            dodajesz w aplikacji.
          </li>
          <li>
            <strong>Skan etykiet:</strong> jeśli korzystasz z funkcji skanowania, zdjęcia
            etykiet są przesyłane do API Anthropic Claude wyłącznie w celu odczytania
            wartości odżywczych. Zdjęcia nie są przechowywane.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">Jak używamy danych</h2>
        <ul className="space-y-2 text-sm leading-relaxed">
          <li>Liczenie kalorii i makroskładników dla Ciebie.</li>
          <li>Wyliczenie zalecanego dziennego zapotrzebowania (TDEE).</li>
          <li>Synchronizacja między urządzeniami po zalogowaniu.</li>
        </ul>
        <p className="text-sm leading-relaxed">
          Nie sprzedajemy Twoich danych. Nie używamy ich do reklam. Nie udostępniamy
          stronom trzecim poza dostawcami infrastruktury:
        </p>
        <ul className="space-y-2 text-sm leading-relaxed">
          <li>Neon Postgres (baza danych) — hostowanie kont i danych żywieniowych.</li>
          <li>Vercel (hosting aplikacji).</li>
          <li>Google / Apple (jeśli logujesz się przez OAuth).</li>
          <li>Anthropic (Claude API) — tylko obrazy skanu etykiet, gdy z niego korzystasz.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">Twoje prawa</h2>
        <ul className="space-y-2 text-sm leading-relaxed">
          <li>
            <strong>Dostęp i eksport:</strong> w aplikacji w Ustawieniach możesz zobaczyć
            wszystkie swoje dane.
          </li>
          <li>
            <strong>Usunięcie konta:</strong> napisz na <a href="mailto:hello@kcal-tracker.app" className="text-foreground underline">hello@kcal-tracker.app</a>{' '}
            — usuwamy wszystkie Twoje dane w ciągu 30 dni.
          </li>
          <li>
            <strong>Lokalne dane:</strong> Ustawienia → Prywatność → "Wyczyść lokalne dane"
            usuwa wszystko z tego urządzenia.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">Bezpieczeństwo</h2>
        <p className="text-sm leading-relaxed">
          Połączenie z serwerem jest szyfrowane (HTTPS/TLS). Hasła są hashowane bcrypt z
          solą. Sesje używają podpisanych tokenów JWT. Nie mamy dostępu do haseł.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">Dzieci</h2>
        <p className="text-sm leading-relaxed">
          Aplikacja nie jest przeznaczona dla osób poniżej 13 roku życia. Nie zbieramy
          świadomie danych od dzieci.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">Kontakt</h2>
        <p className="text-sm leading-relaxed">
          Pytania o prywatność: <a href="mailto:hello@kcal-tracker.app" className="text-foreground underline">hello@kcal-tracker.app</a>
        </p>
      </section>
    </article>
  );
}
