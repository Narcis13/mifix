# MiFix - Ghid de Build & Deploy

## Arhitectura de Deployment

```
┌─────────────────────────┐         ┌──────────────────────────┐
│  Server Apache (Client) │  HTTP   │  VPS (API Server)        │
│  SPA React (fișiere     │ ──────> │  Bun + Hono + PM2        │
│  statice HTML/JS/CSS)   │         │  http://109.99.176.211   │
│                         │         │  Port: 3009              │
└─────────────────────────┘         │  MySQL local             │
                                    └──────────────────────────┘
```

---

## Partea 1: Server API (VPS - Bun + Hono + PM2)

### 1.1 Prerechizite pe VPS

```bash
# Verifică versiunea Bun
bun --version

# MySQL trebuie instalat și rulând
mysql --version
systemctl status mysql

# Instalează PM2 global
bun install -g pm2
```

### 1.2 Pregătire baza de date

```bash
mysql -u root -p
```

```sql
CREATE DATABASE mifix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mifix'@'localhost' IDENTIFIED BY 'PAROLA_SIGURA_AICI';
GRANT ALL PRIVILEGES ON mifix.* TO 'mifix'@'localhost';
FLUSH PRIVILEGES;
```

### 1.3 Copiere fișiere pe VPS

Copiază tot proiectul pe VPS (e nevoie de monorepo complet pentru workspace-uri):

```bash
# De pe mașina locală:
rsync -avz --exclude node_modules --exclude .git --exclude dist \
  /calea/la/mifix/ \
  user@109.99.176.211:/opt/mifix/
```

Sau cu arhivă:
```bash
cd /calea/la/mifix
tar czf mifix.tar.gz --exclude=node_modules --exclude=.git --exclude=dist .
scp mifix.tar.gz user@109.99.176.211:/opt/mifix/
```

Pe VPS:
```bash
mkdir -p /opt/mifix
cd /opt/mifix
tar xzf mifix.tar.gz
rm mifix.tar.gz
```

### 1.4 Instalare dependențe și build

```bash
cd /opt/mifix
bun install
bun run --cwd packages/server build
```

Produce `packages/server/dist/index.js` — bundle standalone pentru Bun.

### 1.5 Configurare environment

Creează fișierul `.env` pentru server:

```bash
cat > /opt/mifix/packages/server/.env << 'EOF'
DB_HOST=localhost
DB_PORT=3306
DB_USER=mifix
DB_PASSWORD=PAROLA_SIGURA_AICI
DB_NAME=mifix
DATABASE_URL=mysql://mifix:PAROLA_SIGURA_AICI@localhost:3306/mifix

PORT=3009
NODE_ENV=production

JWT_SECRET=CHEIE_SECRETA_GENEREAZA_CU_OPENSSL

# CORS - originea clientului (sau * daca folosesti Apache proxy)
CORS_ORIGIN=http://ADRESA_SERVER_APACHE

# Cookies - false pentru HTTP, true doar cu HTTPS
COOKIE_SECURE=false
EOF

chmod 600 /opt/mifix/packages/server/.env
```

Generează un JWT_SECRET sigur:
```bash
openssl rand -base64 48
```

### 1.6 Aplicare schema și seed

```bash
cd /opt/mifix
bun run --cwd packages/server db:push
bun run --cwd packages/server db:seed
```

### 1.7 Test manual

```bash
cd /opt/mifix
bun run packages/server/dist/index.js
```

Din altă sesiune SSH sau local:
```bash
curl http://109.99.176.211:3009/
# Răspuns așteptat: {"message":"MiFix API","version":"0.2.0"}
# Valoarea vine din packages/shared/src/app-version.ts

curl http://109.99.176.211:3009/api/health
```

Oprește procesul manual (Ctrl+C) după verificare.

### 1.8 Rulare cu PM2

Proiectul include fișierul `ecosystem.config.cjs` cu configurarea PM2.

```bash
cd /opt/mifix

# Creează directorul de loguri
mkdir -p logs

# Pornește aplicația
pm2 start ecosystem.config.cjs

# Verifică status
pm2 status

# Vezi loguri live
pm2 logs mifix-api

# Salvează lista de procese (pentru restart automat la reboot)
pm2 save

# Configurează PM2 să pornească la boot
pm2 startup
# Rulează comanda afișată de pm2 startup (copiază și execută)
```

#### Comenzi PM2 utile

```bash
pm2 status                    # Status toate procesele
pm2 logs mifix-api            # Loguri live
pm2 logs mifix-api --lines 50 # Ultimele 50 de linii
pm2 restart mifix-api         # Restart
pm2 stop mifix-api            # Oprire
pm2 delete mifix-api          # Șterge din PM2
pm2 monit                     # Monitor interactiv (CPU, RAM)
pm2 info mifix-api            # Detalii proces
```

---

## Partea 2: Client SPA (Apache HTTP Server)

### 2.1 Ce s-a modificat deja în cod

Fișierul `packages/client/src/lib/api.ts` citește acum URL-ul API din environment:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || "/api";
```

Fișierul `packages/client/.env.production` conține:

```
VITE_API_URL=http://109.99.176.211:3009/api
```

> **Notă:** Dacă folosești varianta cu Apache reverse proxy (Partea 3 - recomandat),
> șterge sau golește `.env.production` ca clientul să folosească `/api` relativ.

### 2.2 Build client

```bash
cd /calea/la/mifix

# Build complet (shared + client)
bun run build
```

Fișierele produse sunt în `packages/client/dist/` — HTML, JS, CSS statice.

Verificare:
```bash
ls packages/client/dist/
# Ar trebui să conțină: index.html, assets/
```

### 2.3 Copiere fișiere pe serverul Apache

```bash
scp -r packages/client/dist/* user@SERVER_APACHE:/var/www/mifix/
```

Sau cu rsync:
```bash
rsync -avz packages/client/dist/ user@SERVER_APACHE:/var/www/mifix/
```

### 2.4 Configurare Apache — Varianta Simplă (fără proxy)

Această variantă trimite requesturi direct la VPS. Necesită CORS configurat pe server.

Creează `.htaccess` în `/var/www/mifix/`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [L]
</IfModule>
```

Module necesare:
```bash
sudo a2enmod rewrite
sudo systemctl reload apache2
```

---

## Partea 3: Varianta Recomandată — Apache Reverse Proxy

Apache face proxy la `/api/*` către VPS. Avantaje:
- Nu trebuie CORS (same-origin)
- Cookies funcționează nativ (Lax sameSite e OK)
- Clientul nu expune IP-ul VPS

### 3.1 Pregătire client pentru proxy

Dacă folosești proxy, clientul trebuie să trimită requesturi pe `/api` (relativ).
Golește fișierul `.env.production`:

```bash
# packages/client/.env.production — lasă gol sau șterge linia VITE_API_URL
```

Apoi rebuild:
```bash
bun run build
```

### 3.2 Configurare server (.env)

Pe VPS, în `.env`:
```
CORS_ORIGIN=*
```

Rebuild server:
```bash
bun run --cwd packages/server build
pm2 restart mifix-api
```

### 3.3 Configurare Apache VirtualHost

```apache
<VirtualHost *:80>
    ServerName mifix.exemplu.ro
    DocumentRoot /var/www/mifix

    # Proxy /api/* către VPS
    ProxyPreserveHost On
    ProxyPass /api http://109.99.176.211:3009/api
    ProxyPassReverse /api http://109.99.176.211:3009/api

    <Directory /var/www/mifix>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # SPA fallback (exclude /api din rewrite)
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteBase /
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_URI} !^/api
        RewriteRule ^ index.html [L]
    </IfModule>

    # Cache pentru assets (Vite pune hash în nume)
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType image/svg+xml "access plus 1 year"
        ExpiresByType font/woff2 "access plus 1 year"
    </IfModule>

    # Gzip
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
    </IfModule>
</VirtualHost>
```

Module necesare:
```bash
sudo a2enmod proxy proxy_http rewrite expires deflate
sudo a2ensite mifix.conf
sudo systemctl reload apache2
```

---

## Partea 4: Checklist Deploy

### Server API (VPS)
- [ ] Bun instalat
- [ ] PM2 instalat global (`bun install -g pm2`)
- [ ] MySQL instalat și rulând
- [ ] Baza de date `mifix` creată cu user și drepturi
- [ ] Fișiere copiate în `/opt/mifix`
- [ ] `bun install` rulat
- [ ] `.env` configurat (DB, JWT_SECRET, PORT=3009, CORS_ORIGIN)
- [ ] `bun run --cwd packages/server build`
- [ ] Schema aplicată: `bun run --cwd packages/server db:push`
- [ ] Seed rulat: `bun run --cwd packages/server db:seed`
- [ ] Test: `curl http://109.99.176.211:3009/` returnează JSON
- [ ] PM2 pornit: `pm2 start ecosystem.config.cjs`
- [ ] PM2 salvat: `pm2 save` + `pm2 startup`
- [ ] Firewall: portul 3009 deschis (dacă nu folosești proxy)

### Client SPA (Apache)
- [ ] `.env.production` setat corect (cu URL sau gol pentru proxy)
- [ ] Build: `bun run build` din root
- [ ] Fișiere din `packages/client/dist/` copiate pe server Apache
- [ ] `.htaccess` sau VirtualHost configurat pentru SPA fallback
- [ ] Module Apache activate
- [ ] Test: accesează aplicația în browser, verifică login

### Securitate
- [ ] JWT_SECRET este o valoare aleatorie lungă
- [ ] Fișierul `.env` are permisiuni `600`
- [ ] MySQL user-ul `mifix` are doar drepturi pe baza `mifix`
- [ ] Firewall configurate (doar porturile necesare deschise)

---

## Comenzi Utile Post-Deploy

```bash
# PM2 — manage server
pm2 restart mifix-api
pm2 logs mifix-api
pm2 monit

# Rebuild și redeploy server după modificări
cd /opt/mifix
# rsync/scp fișierele noi sau git pull
bun install
bun run --cwd packages/server build
pm2 restart mifix-api

# Rebuild și redeploy client după modificări
bun run build
scp -r packages/client/dist/* user@SERVER_APACHE:/var/www/mifix/
```
