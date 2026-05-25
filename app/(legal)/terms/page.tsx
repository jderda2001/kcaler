export const metadata = {
  title: 'Regulamin · Kcal Tracker',
};

export default function TermsPage() {
  return (
    <article className="prose max-w-none">
      <h1 className="text-3xl font-semibold tracking-tight">Regulamin</h1>
      <p className="text-muted-foreground mt-1 text-sm">Ostatnia aktualizacja: 2026-05-25</p>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">1. Czym jest Kcal Tracker</h2>
        <p className="text-sm leading-relaxed">
          Kcal Tracker to aplikacja do śledzenia spożycia kalorii i makroskładników.
          Korzystanie z aplikacji jest dobrowolne i bezpłatne. Aplikacja nie zastępuje porady
          dietetyka ani lekarza.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">2. Twoje konto</h2>
        <p className="text-sm leading-relaxed">
          Odpowiadasz za bezpieczeństwo swojego hasła. Jedna osoba — jedno konto. Możesz
          usunąć konto w każdej chwili.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">3. Dokładność danych</h2>
        <p className="text-sm leading-relaxed">
          Wartości odżywcze w bazie produktów oraz wynikające z funkcji skanowania etykiet
          są przybliżone i mogą zawierać błędy. Sprawdzaj zawsze etykietę produktu jeśli
          dokładność jest dla Ciebie krytyczna (np. cukrzyca, alergie).
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">4. Ograniczenie odpowiedzialności</h2>
        <p className="text-sm leading-relaxed">
          Aplikacja dostarczana jest &quot;tak jak jest&quot;. Nie ponosimy odpowiedzialności
          za decyzje żywieniowe podjęte na podstawie danych z aplikacji. Skonsultuj zmiany
          diety z profesjonalistą.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">5. Zmiany regulaminu</h2>
        <p className="text-sm leading-relaxed">
          Możemy zmieniać regulamin. Istotne zmiany ogłosimy w aplikacji lub przez email.
          Dalsze korzystanie po zmianach oznacza ich akceptację.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">6. Kontakt</h2>
        <p className="text-sm leading-relaxed">
          <a href="mailto:hello@kcal-tracker.app" className="text-foreground underline">
            hello@kcal-tracker.app
          </a>
        </p>
      </section>
    </article>
  );
}
