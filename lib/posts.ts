export type PostStatus = "scheduled" | "draft" | "published" | "backlog";
export type PostType = "photo" | "reel" | "story" | "carousel";

export interface Post {
  id: string;
  caption: string;
  type: PostType;
  status: PostStatus;
  scheduledDate?: string; // ISO date
  createdAt: string;
}

export const POST_TYPES: PostType[] = ["photo", "reel", "story", "carousel"];
export const POST_STATUSES: PostStatus[] = ["scheduled", "draft", "published", "backlog"];

export const STATUS_LABELS: Record<PostStatus, string> = {
  scheduled: "Programado",
  draft: "Borradores",
  published: "Publicado",
  backlog: "Ideas",
};

export const TYPE_LABELS: Record<PostType, string> = {
  photo: "Foto",
  reel: "Reel",
  story: "Historia",
  carousel: "Carrusel",
};

export const SEED_POSTS: Post[] = [
  {
    id: "1",
    caption: "Cómo leer el balance de una empresa en 5 minutos 📊 Guía rápida para inversores principiantes.",
    type: "carousel",
    status: "scheduled",
    scheduledDate: "2026-04-18",
    createdAt: "2026-04-14",
  },
  {
    id: "2",
    caption: "¿Dólar MEP, CCL o cripto? Comparamos las tres opciones para dolarizarte.",
    type: "reel",
    status: "scheduled",
    scheduledDate: "2026-04-20",
    createdAt: "2026-04-13",
  },
  {
    id: "3",
    caption: "3 errores típicos al armar tu primera cartera de inversión.",
    type: "reel",
    status: "draft",
    createdAt: "2026-04-12",
  },
  {
    id: "4",
    caption: "Q&A: respondemos sus preguntas sobre FCI y plazos fijos UVA.",
    type: "story",
    status: "draft",
    createdAt: "2026-04-11",
  },
  {
    id: "5",
    caption: "Resumen semanal: Merval, riesgo país y dólar. Todo lo que pasó.",
    type: "carousel",
    status: "published",
    scheduledDate: "2026-04-10",
    createdAt: "2026-04-09",
  },
  {
    id: "6",
    caption: "Interés compuesto explicado con un mate y una calculadora ☕",
    type: "reel",
    status: "published",
    scheduledDate: "2026-04-07",
    createdAt: "2026-04-06",
  },
  {
    id: "7",
    caption: "Idea: serie 'Diccionario financiero' — un término por reel.",
    type: "reel",
    status: "backlog",
    createdAt: "2026-04-10",
  },
  {
    id: "8",
    caption: "Idea: carrusel comparando bonos AL30 vs GD30 con gráficos.",
    type: "carousel",
    status: "backlog",
    createdAt: "2026-04-08",
  },
];
