# Retrospektywa Decyzji Finansowych

Aplikacja do wspólnej retrospektywy decyzji finansowych w parze (osoba A i B). Każda osoba niezależnie ocenia przeszłe decyzje — ocena partnera jest ukryta do momentu zablokowania obu ocen.

## Stos technologiczny

- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4 + TanStack Query
- **Backend**: Express + TypeScript + better-sqlite3
- **Shared**: Zod schemas + typy TypeScript (npm workspaces monorepo)

## Uruchomienie

```bash
npm install
npm run build:shared
npm run dev              # serwer (3001) + klient (5173)
```

Lub osobno:

```bash
npm run dev:server       # Express na http://localhost:3001
npm run dev:client       # Vite na http://localhost:5173
```

## Testowanie

Otwórz dwie przeglądarki (lub jedną incognito) i zaloguj się jako osoba A i B.

## Flow

1. **Propozycja** — jedna osoba dodaje decyzję do retrospektywy
2. **Akceptacja** — druga osoba potwierdza, że decyzja miała miejsce
3. **Ocena** — każda osoba niezależnie wypełnia: rating 1-5, argumenty za/przeciw, największe zignorowane ryzyko, odpowiedzialność
4. **Blokada** — po wypełnieniu osoba blokuje swoją ocenę (nieodwracalne)
5. **Oczekiwanie** — polling co 3s, auto-redirect gdy obie zablokowane
6. **Porównanie** — split view z highlight różnic (zielony/żółty/czerwony)
7. **Wspólny wniosek** — para wspólnie formułuje wnioski
8. **Meta-wnioski** — biasy poznawcze, zasady, red flagi

## Mechanizm "Reveal"

Endpoint `/compare` zwraca ocenę partnera **tylko** gdy obie oceny mają status `locked`. Brak endpointu unlock. Brak ścieżki wycieku danych przed zablokowaniem.

## Struktura

```
├── shared/          # Typy, schematy Zod, stałe
├── server/          # Express API + SQLite
│   └── src/
│       ├── db/          # Połączenie + migracja
│       ├── middleware/   # Auth (X-User-Id), error handler
│       ├── repositories/ # Zapytania SQL
│       ├── services/     # Logika biznesowa (reveal guard, lock)
│       └── routes/       # Endpointy API
└── client/          # React + Vite
    └── src/
        ├── api/         # Fetch wrapper + endpointy
        ├── context/     # AuthContext (A|B)
        ├── components/  # AppShell, AuthGuard, ErrorBoundary
        ├── pages/       # 9 stron
        └── lib/         # Polskie labele, utilities
```
