# Mio Portafoglio

Web app per la gestione del patrimonio personale: investimenti (senza quantità obbligatorie), liquidità, fondi pensione, PAC, andamento, obiettivi, backup, report PDF, PIN. React + TypeScript + Vite + Tailwind, Supabase (auth + database), Netlify.

## Avvio locale
1. `npm install`
2. `cp .env.example .env` e inserisci `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (solo chiave pubblica/anon, mai service_role). Senza queste variabili l'app funziona in modalità locale, senza account.
3. `npm run dev` · `npm run typecheck` · `npm test` · `npm run build`

## Database
Esegui `supabase/schema.sql` nell'SQL Editor di Supabase. L'app usa oggi la tabella `user_state` (un documento per utente con revisione); le tabelle relazionali sono predisposte per un'evoluzione futura. Tutte hanno Row Level Security.

## Come funziona
- Importi in centesimi interi (niente errori floating point). Cambi manuali: 1 unità estera = X EUR; se manca un cambio l'elemento è escluso dai totali con avviso.
- Un versamento non è un guadagno. Le vendite senza quantità usano un criterio proporzionale, presentato come stima e non come calcolo fiscale.
- Movimenti modificabili/annullabili dallo storico: posizioni, conti, rate PAC e trasferimenti vengono ripristinati in modo coerente. Una vendita modificata viene ricalcolata sullo stato attuale (stima proporzionale).
- Sincronizzazione con revisioni e merge a tre vie per elemento (conflitto solo se lo stesso elemento cambia in modo diverso su due dispositivi): le modifiche offline restano in locale e vengono inviate al ritorno della connessione; in caso di conflitto l'app si ferma e chiede cosa fare, senza cancellare nulla.
- Gli snapshot si creano solo quando l'app è in uso (nessun processo server pianificato).
- Il PIN protegge solo il dispositivo; non sostituisce la sicurezza dell'account.

Vedi `DEPLOY.md`, `CHECKLIST.md` e `TEST-REPORT.md`.
