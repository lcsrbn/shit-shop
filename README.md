# shit-shop

E-commerce sperimentale costruito con **Next.js**, deployato su **Vercel**, con dominio custom:

**https://idontneedthisshitandneitherdoyou.com**

Il progetto usa un naming coerente ovunque:

- cartella locale: `shit-shop`
- repository GitHub: `shit-shop`
- progetto Vercel: `shit-shop`
- container Docker: `shit-shop-nextjs`
- dominio pubblico: `idontneedthisshitandneitherdoyou.com`

---

## Stack

- Next.js 16
- React
- TypeScript
- Stripe Checkout
- Vercel
- Namecheap
- Docker
- GitHub

---

## Stato attuale del progetto

Attualmente il progetto è online ma protetto tramite **maintenance mode**.

### Funzionalità presenti

- homepage shop con card prodotto animate
- carrello client-side
- checkout Stripe
- pagina `success`
- pagina `cancel`
- maintenance mode globale
- accesso admin privato durante la maintenance
- deploy automatico da GitHub a Vercel
- dominio custom collegato

### Funzionalità rinviate

- webhook Stripe
- email automatiche post-acquisto
- database ordini persistente
- spedizioni per area geografica
- dashboard admin
- autenticazione cliente

---

## Repository workflow

Tutte le modifiche vengono fatte così:

```bash
git add .
git commit -m "messaggio chiaro"
git push