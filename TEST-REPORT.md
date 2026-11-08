# Rapporto test
**Stato: NESSUN test è stato eseguito.** L'ambiente di sviluppo non aveva accesso alla rete, quindi `npm install`, `npm run typecheck`, `npm test` e `npm run build` non sono mai stati lanciati. Non è stato provato nulla nel browser né contro un progetto Supabase reale.
## Test scritti (da eseguire con `npm test`)
- finance: rendimento, capitale zero, versamento, vendita parziale proporzionale, vendita oltre il valore, CAGR.
- money: assenza di errori floating point, cambio mancante.
- totals: somma in EUR con cambio mancante.
- pac: scadenze con fine mese, promemoria, rate duplicate.
- csv: protezione da formula injection, virgolette.
- backup: andata e ritorno, file non validi, importi non interi, id duplicati, unione senza sovrascritture.
- sync: primo invio, stato allineato, scarico, conflitto, scrittura rifiutata.
- ledger: annullo/modifica di versamenti, vendite (con conto collegato), rate PAC, trasferimenti, entrate/uscite, contributi pensione.
- merge: unione a tre vie, modifica su un solo lato, conflitti, eliminazioni, riferimenti orfani; sync con merge automatico.
- series: crescita al netto dei flussi, classificazione dei flussi, cambio mancante.
## Non coperto da test automatici
PIN, interfaccia (React Testing Library), PDF, politiche RLS e isolamento utenti (da verificare con la checklist), flusso email di Supabase.
