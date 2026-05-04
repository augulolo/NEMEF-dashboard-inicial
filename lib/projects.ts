// ──────────────────────────────────────────────────────────────
// Tipos para el Laboratorio de Proyectos de Contenido
// ──────────────────────────────────────────────────────────────

export interface BibliographyRef {
  id: string;
  type: "libro" | "paper" | "articulo" | "video" | "podcast" | "web" | "otro";
  title: string;
  author?: string;       // Autor(es)
  year?: number;         // Año de publicación
  publisher?: string;    // Editorial / fuente
  url?: string;          // Enlace opcional
  notes?: string;        // Notas personales sobre la referencia
}

export interface KeyConcept {
  id: string;
  term: string;          // Nombre del concepto
  definition: string;    // Definición clara y concisa
  example?: string;      // Ejemplo aplicado
  related?: string[];    // Términos relacionados
}

export interface LearningObjective {
  id: string;
  text: string;          // "Al finalizar este capítulo, el lector podrá..."
  type: "saber" | "entender" | "aplicar" | "analizar";
}

export interface ProjectChapter {
  id: string;
  order: number;         // Posición dentro del proyecto
  title: string;
  summary: string;       // Resumen / descripción del capítulo
  scriptNotes: string;   // Notas de guion (texto libre, ideas, estructura)
  learningObjectives: LearningObjective[];
  keyConcepts: KeyConcept[];
  bibliography: BibliographyRef[];
  targetAudience?: string; // A quién está dirigido este capítulo
  estimatedDuration?: string; // "5 min lectura", "15 min video", etc.
  status: "borrador" | "en_progreso" | "revisión" | "listo";
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  topic: string;          // Ej: "Finanzas personales", "Inversión", "Cripto"
  targetAudience: string; // A quién está dirigido el proyecto completo
  platform: "instagram" | "youtube" | "tiktok" | "blog" | "multiple";
  status: "activo" | "pausado" | "completado" | "archivado";
  chapters: ProjectChapter[];
  tags: string[];
  coverEmoji?: string;    // Emoji representativo del proyecto
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────────────────────
// Utilidades
// ──────────────────────────────────────────────────────────────

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function newProject(overrides?: Partial<Project>): Project {
  const now = new Date().toISOString();
  return {
    id: newId(),
    title: "",
    description: "",
    topic: "",
    targetAudience: "",
    platform: "instagram",
    status: "activo",
    chapters: [],
    tags: [],
    coverEmoji: "📚",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function newChapter(order: number, overrides?: Partial<ProjectChapter>): ProjectChapter {
  const now = new Date().toISOString();
  return {
    id: newId(),
    order,
    title: "",
    summary: "",
    scriptNotes: "",
    learningObjectives: [],
    keyConcepts: [],
    bibliography: [],
    targetAudience: "",
    estimatedDuration: "",
    status: "borrador",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function newBibRef(overrides?: Partial<BibliographyRef>): BibliographyRef {
  return {
    id: newId(),
    type: "libro",
    title: "",
    author: "",
    year: new Date().getFullYear(),
    publisher: "",
    url: "",
    notes: "",
    ...overrides,
  };
}

export function newKeyConcept(overrides?: Partial<KeyConcept>): KeyConcept {
  return {
    id: newId(),
    term: "",
    definition: "",
    example: "",
    related: [],
    ...overrides,
  };
}

export function newLearningObjective(overrides?: Partial<LearningObjective>): LearningObjective {
  return {
    id: newId(),
    text: "",
    type: "entender",
    ...overrides,
  };
}

export const PLATFORM_LABELS: Record<Project["platform"], string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  blog: "Blog / Newsletter",
  multiple: "Multiplataforma",
};

export const STATUS_LABELS: Record<Project["status"], string> = {
  activo: "Activo",
  pausado: "Pausado",
  completado: "Completado",
  archivado: "Archivado",
};

export const CHAPTER_STATUS_LABELS: Record<ProjectChapter["status"], string> = {
  borrador: "Borrador",
  en_progreso: "En progreso",
  revisión: "En revisión",
  listo: "Listo",
};

export const CHAPTER_STATUS_COLORS: Record<ProjectChapter["status"], string> = {
  borrador: "text-muted-foreground border-border bg-muted/30",
  en_progreso: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  revisión: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  listo: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
};

export const REF_TYPE_LABELS: Record<BibliographyRef["type"], string> = {
  libro: "Libro",
  paper: "Paper / Estudio",
  articulo: "Artículo",
  video: "Video",
  podcast: "Podcast",
  web: "Sitio web",
  otro: "Otro",
};

export const OBJECTIVE_TYPE_LABELS: Record<LearningObjective["type"], string> = {
  saber: "Saber",
  entender: "Entender",
  aplicar: "Aplicar",
  analizar: "Analizar",
};
