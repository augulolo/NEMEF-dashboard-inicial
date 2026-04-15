# Deploy y persistencia — NEMEF

## Cómo se guardan los cambios HOY

Ahora mismo, todo lo que agregues en **Gestor de Instagram** y **Creadores** se guarda en el **`localStorage` del navegador** usando el hook `hooks/use-local-storage.ts`.

**Qué significa esto:**
- Persiste entre recargas y reinicios del servidor ✅
- **Es por navegador** — si entrás desde otra PC o borrás cookies, no está ❌
- No se comparte entre usuarios ❌

Perfecto para uso personal o para probar. Cuando quieras **colaboración / multi-usuario / datos en la nube**, pasá a una base de datos real (ver abajo).

---

## 1. Desplegar la app (sin base de datos)

### Opción A — Vercel (lo más simple, gratis)

1. Subí el proyecto a GitHub:
   ```bash
   cd "/Users/agustin/Desktop/Dashboard rrpp"
   git init
   git add .
   git commit -m "NEMEF dashboard inicial"
   gh repo create nemef-dashboard --public --source=. --push
   ```
   (Si no tenés `gh`, creá el repo en github.com y `git push`.)

2. Andá a **https://vercel.com**, login con GitHub, **Import Project** y elegí el repo.
3. Vercel detecta Next.js automáticamente. Click **Deploy**.
4. En ~1 minuto tenés una URL pública tipo `nemef-dashboard.vercel.app`.
5. Cada `git push` redespliega solo.

### Opción B — Servidor propio (VPS, Hetzner, DigitalOcean)

```bash
# En tu servidor (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
git clone <tu-repo> nemef && cd nemef
npm install
npm run build
npm install -g pm2
pm2 start npm --name nemef -- start
pm2 save && pm2 startup
```

Poné un Nginx adelante con SSL (Certbot) apuntando a `localhost:3000`.

---

## 2. Pasar a base de datos real

El código ya está organizado para que sea fácil: cada página usa un hook que guarda un array. Hay que reemplazar `useLocalStorage` por `fetch()` a una API.

### Opción recomendada — **Supabase** (Postgres gestionado, gratis hasta 500 MB)

**Ventajas:** base SQL real, autenticación incluida, dashboard web, funciona con Vercel out-of-the-box.

1. Creá cuenta en **https://supabase.com** → nuevo proyecto.
2. En el editor SQL de Supabase, corré:

```sql
create table posts (
  id uuid primary key default gen_random_uuid(),
  caption text not null,
  type text not null,
  status text not null,
  scheduled_date date,
  created_at timestamptz default now()
);

create table competitors (
  id uuid primary key default gen_random_uuid(),
  handle text not null,
  name text not null,
  platform text not null,
  region text not null,
  followers int default 0,
  followers_history jsonb default '[]',
  engagement_rate numeric default 0,
  posts_per_week numeric default 0,
  recent_posts jsonb default '[]',
  created_at timestamptz default now()
);
```

3. Instalá el cliente:
   ```bash
   npm install @supabase/supabase-js
   ```

4. Creá `lib/supabase.ts`:
   ```ts
   import { createClient } from "@supabase/supabase-js";
   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   );
   ```

5. Agregá a `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   ```

6. Reemplazá `useLocalStorage` en `app/instagram/page.tsx`:
   ```ts
   const [posts, setPosts] = useState<Post[]>([]);
   useEffect(() => {
     supabase.from("posts").select("*").then(({ data }) => setPosts(data ?? []));
   }, []);
   const handleCreate = async (post: Post) => {
     const { data } = await supabase.from("posts").insert(post).select().single();
     if (data) setPosts((p) => [data, ...p]);
   };
   ```

Y lo mismo para `competitors`. En Vercel, agregá las mismas env vars en **Settings → Environment Variables**.

### Opción más simple — **SQLite + Prisma** (base local en el servidor)

Buena si vas a correr en tu propio VPS y no querés un servicio externo.

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite
```

Definí el schema en `prisma/schema.prisma`, corré `npx prisma migrate dev`, y creás API routes en `app/api/posts/route.ts` que hagan los CRUD con `prisma.post.findMany()`, etc.

### Opción más robusta — **Vercel Postgres** o **Neon**

Postgres serverless, se integra con Vercel en un clic. Usá con **Drizzle ORM** o **Prisma**. Gratis hasta cierto límite.

---

## 3. Tabla resumen

| Opción | Dificultad | Costo | Multi-usuario | Cuándo usarla |
|---|---|---|---|---|
| `localStorage` (actual) | Ninguna | $0 | ❌ | Uso personal, demo |
| Supabase | Baja | $0 (free tier) | ✅ | **Recomendado para empezar** |
| SQLite + Prisma | Media | $0 | ✅ (1 servidor) | VPS propio |
| Vercel Postgres / Neon | Media | $0-$20/mes | ✅ | Producción seria |

---

## 4. Variables de entorno

Copiá `.env.example` a `.env.local` cuando integres una base de datos. No subas `.env.local` a Git (ya está en `.gitignore`).

---

## 5. Reemplazar el logo

Subí tu PNG a `public/nemef-logo.png` y editá `components/logo.tsx` para que apunte a ese archivo (hoy usa el SVG de `public/nemef-logo.svg`).
