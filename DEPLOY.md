# Pubblicazione: GitHub + Netlify + Supabase
## 1. Supabase
1. Crea un progetto su supabase.com.
2. SQL Editor → incolla ed esegui `supabase/schema.sql`.
3. Authentication → URL Configuration: imposta *Site URL* sull'indirizzo Netlify e aggiungilo ai *Redirect URLs* (serve al recupero password).
4. Authentication → Providers: lascia attivo Email. Decidi se richiedere la conferma email.
5. Project Settings → API: copia *Project URL* e la chiave *anon/public*. NON usare mai la chiave service_role.
## 2. GitHub
```
git init && git add . && git commit -m "Mio Portafoglio"
git branch -M main
git remote add origin https://github.com/TUO-UTENTE/mio-portafoglio.git
git push -u origin main
```
Il file `.env` è ignorato da `.gitignore`: non va mai caricato.
## 3. Netlify
1. Add new site → Import from Git → scegli il repository.
2. Build command `npm run build`, publish directory `dist` (già in `netlify.toml`, comprese le route SPA).
3. Site settings → Environment variables: aggiungi `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Deploy. Dopo ogni modifica alle variabili serve un nuovo deploy.

## Verifica automatica
Il workflow `.github/workflows/ci.yml` esegue `typecheck`, test e build ad ogni push su GitHub: guarda la scheda *Actions* prima di fidarti del deploy. Se la CI è rossa, copia l'errore e correggilo prima di pubblicare.
