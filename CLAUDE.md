# NEMEF — No es Magia, Es Finanzas

Dashboard de gestión de contenido orientado al mundo de finanzas (Argentina + mundo).

## Stack

- **Framework:** Next.js 14 (App Router, React Server Components)
- **Lenguaje:** TypeScript (strict)
- **Estilos:** Tailwind CSS + CSS variables
- **UI:** convenciones shadcn/ui (primitivas en `components/ui/`)
- **Iconos:** lucide-react
- **Persistencia actual:** `localStorage` vía `hooks/use-local-storage.ts`
- **Tema:** dark mode global (`className="dark"` en `<html>`)

## Estructura

```
.
├── app/
│   ├── layout.tsx            # layout raíz con sidebar
│   ├── page.tsx              # home
│   ├── instagram/page.tsx    # Gestor de Instagram (persistido en LS)
│   ├── calendar/page.tsx     # Calendario mensual
│   ├── competitors/page.tsx  # Creadores (persistido en LS)
│   ├── news/page.tsx         # Noticias (fetch de /api/news)
│   ├── analytics/page.tsx    # placeholder
│   ├── api/news/route.ts     # agregador RSS server-side
│   └── globals.css           # tokens del theme
├── components/
│   ├── sidebar.tsx           # nav con logo NEMEF
│   ├── logo.tsx              # wrapper del logo
│   ├── page-header.tsx
│   ├── instagram/            # form, card, columna del kanban
│   ├── calendar/             # grid, filtro de plataforma, detalle de día
│   ├── competitors/          # tabla sortable, sparkline, form
│   ├── news/                 # card, filtro de topic
│   └── ui/                   # shadcn primitives
├── hooks/
│   └── use-local-storage.ts  # persistencia cliente
├── lib/
│   ├── utils.ts              # cn()
│   ├── posts.ts              # tipos + seed posts Instagram
│   ├── calendar.ts           # tipos + seed calendario
│   ├── competitors.ts        # tipos + seed creadores AR/mundo
│   └── news.ts               # feeds RSS + clasificador de topics
├── public/
│   └── nemef-logo.svg        # logo (reemplazable por PNG)
├── DEPLOY.md                 # guía de deploy y migración a DB real
└── CLAUDE.md
```

## Convenciones

- Las primitivas shadcn viven en `components/ui/`.
- Componentes con hooks de React van con `"use client"` arriba.
- Todo el texto visible está en **español rioplatense**.
- Los seeds en `lib/*.ts` están orientados a finanzas (Argentina + mundo).
- Los colores se usan vía tokens (`bg-background`, `text-muted-foreground`, etc.) — no se hardcodean.

## Persistencia

**Hoy:** `localStorage` (solo en el navegador del usuario).

**Para producción multi-usuario:** migrar a Supabase / Postgres siguiendo [DEPLOY.md](DEPLOY.md).

## Correr el proyecto

```bash
npm install
npm run dev
```

Abrir **http://localhost:3000**.
