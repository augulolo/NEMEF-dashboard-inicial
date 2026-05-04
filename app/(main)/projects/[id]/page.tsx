"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown,
  BookOpen, Target, Lightbulb, FileText, Link2, Edit3,
  CheckCircle2, Save, X, ExternalLink, GripVertical,
  BookMarked, Layers, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Project, ProjectChapter, BibliographyRef, KeyConcept, LearningObjective,
  newChapter, newBibRef, newKeyConcept, newLearningObjective, newId,
  PLATFORM_LABELS, STATUS_LABELS, CHAPTER_STATUS_LABELS, CHAPTER_STATUS_COLORS,
  REF_TYPE_LABELS, OBJECTIVE_TYPE_LABELS,
} from "@/lib/projects";

const LS_KEY = "nemef_projects_v1";

function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function saveProjects(projects: Project[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(projects));
}

// ──────────────────────────────────────────────────────────────
// Sub-componente: Editor de capítulo
// ──────────────────────────────────────────────────────────────

function ChapterEditor({
  chapter,
  onSave,
  onClose,
}: {
  chapter: ProjectChapter;
  onSave: (updated: ProjectChapter) => void;
  onClose: () => void;
}) {
  const [data, setData] = useState<ProjectChapter>(() => JSON.parse(JSON.stringify(chapter)));

  const update = (patch: Partial<ProjectChapter>) =>
    setData((prev) => ({ ...prev, ...patch, updatedAt: new Date().toISOString() }));

  // ── Objetivos ──
  const addObjective = () =>
    update({ learningObjectives: [...data.learningObjectives, newLearningObjective()] });
  const updateObjective = (id: string, patch: Partial<LearningObjective>) =>
    update({
      learningObjectives: data.learningObjectives.map((o) =>
        o.id === id ? { ...o, ...patch } : o
      ),
    });
  const removeObjective = (id: string) =>
    update({ learningObjectives: data.learningObjectives.filter((o) => o.id !== id) });

  // ── Conceptos clave ──
  const addConcept = () =>
    update({ keyConcepts: [...data.keyConcepts, newKeyConcept()] });
  const updateConcept = (id: string, patch: Partial<KeyConcept>) =>
    update({
      keyConcepts: data.keyConcepts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  const removeConcept = (id: string) =>
    update({ keyConcepts: data.keyConcepts.filter((c) => c.id !== id) });

  // ── Bibliografía ──
  const addRef = () => update({ bibliography: [...data.bibliography, newBibRef()] });
  const updateRef = (id: string, patch: Partial<BibliographyRef>) =>
    update({
      bibliography: data.bibliography.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  const removeRef = (id: string) =>
    update({ bibliography: data.bibliography.filter((r) => r.id !== id) });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-y-auto py-6 px-4">
      <div className="w-full max-w-3xl rounded-xl border bg-card shadow-2xl">
        {/* Header del editor */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">
              {data.title || `Capítulo ${data.order}`}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={data.status}
              onChange={(e) => update({ status: e.target.value as ProjectChapter["status"] })}
              className={cn(
                "rounded-md border px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring bg-background",
                CHAPTER_STATUS_COLORS[data.status]
              )}
            >
              {Object.entries(CHAPTER_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <Button size="sm" onClick={() => onSave(data)}>
              <Save className="h-3.5 w-3.5" />
              Guardar
            </Button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Información básica */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Información del capítulo
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Título *</label>
                <Input
                  value={data.title}
                  onChange={(e) => update({ title: e.target.value })}
                  placeholder="Ej: Capítulo 1 — ¿Qué es el dinero?"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Audiencia objetivo</label>
                  <Input
                    value={data.targetAudience ?? ""}
                    onChange={(e) => update({ targetAudience: e.target.value })}
                    placeholder="Ej: Adultos jóvenes sin conocimiento financiero"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Duración estimada</label>
                  <Input
                    value={data.estimatedDuration ?? ""}
                    onChange={(e) => update({ estimatedDuration: e.target.value })}
                    placeholder="Ej: 10 min de lectura"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Resumen del capítulo</label>
                <textarea
                  value={data.summary}
                  onChange={(e) => update({ summary: e.target.value })}
                  placeholder="¿De qué trata este capítulo? ¿Qué problema o pregunta responde?"
                  className="mt-1 w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </section>

          {/* Objetivos de aprendizaje */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                Objetivos de aprendizaje
              </h3>
              <button
                onClick={addObjective}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Agregar
              </button>
            </div>
            {data.learningObjectives.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Definí qué va a poder saber, entender, aplicar o analizar alguien al terminar este capítulo.
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.learningObjectives.map((obj) => (
                  <div key={obj.id} className="flex gap-2 items-start">
                    <select
                      value={obj.type}
                      onChange={(e) => updateObjective(obj.id, { type: e.target.value as LearningObjective["type"] })}
                      className="shrink-0 rounded-md border bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {Object.entries(OBJECTIVE_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <Input
                      value={obj.text}
                      onChange={(e) => updateObjective(obj.id, { text: e.target.value })}
                      placeholder="Al terminar este capítulo, el lector podrá..."
                      className="flex-1"
                    />
                    <button
                      onClick={() => removeObjective(obj.id)}
                      className="text-muted-foreground hover:text-red-400 transition-colors mt-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Notas de guion */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
              <Edit3 className="h-3.5 w-3.5" />
              Notas de guion
            </h3>
            <textarea
              value={data.scriptNotes}
              onChange={(e) => update({ scriptNotes: e.target.value })}
              placeholder={`Estructura del contenido, ideas principales, ejemplos a usar, preguntas retóricas, transiciones...\n\nEj:\n- Abrí con una pregunta: '¿Cuánto te dura la plata a fin de mes?'\n- Explicar el concepto de flujo de caja con un ejemplo cotidiano\n- Cierre con llamada a la acción: que escriban sus gastos fijos`}
              className="w-full min-h-[150px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            />
          </section>

          {/* Conceptos clave */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" />
                Conceptos clave
              </h3>
              <button
                onClick={addConcept}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Agregar
              </button>
            </div>
            {data.keyConcepts.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Definí los términos técnicos o conceptos centrales que vas a explicar en este capítulo.
              </p>
            ) : (
              <div className="space-y-4">
                {data.keyConcepts.map((concept) => (
                  <div key={concept.id} className="rounded-lg border bg-muted/20 p-3 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={concept.term}
                        onChange={(e) => updateConcept(concept.id, { term: e.target.value })}
                        placeholder="Término (ej: Tasa de interés)"
                        className="font-semibold flex-1"
                      />
                      <button
                        onClick={() => removeConcept(concept.id)}
                        className="text-muted-foreground hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      value={concept.definition}
                      onChange={(e) => updateConcept(concept.id, { definition: e.target.value })}
                      placeholder="Definición clara y accesible del concepto..."
                      className="w-full min-h-[60px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Input
                      value={concept.example ?? ""}
                      onChange={(e) => updateConcept(concept.id, { example: e.target.value })}
                      placeholder="Ejemplo concreto aplicado (opcional)"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Bibliografía */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <BookMarked className="h-3.5 w-3.5" />
                Bibliografía y fuentes
              </h3>
              <button
                onClick={addRef}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Agregar fuente
              </button>
            </div>
            {data.bibliography.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Agregá las fuentes que respaldán el contenido: libros, papers, artículos, estudios, videos, etc.
              </p>
            ) : (
              <div className="space-y-3">
                {data.bibliography.map((ref) => (
                  <div key={ref.id} className="rounded-lg border bg-muted/20 p-3 space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={ref.type}
                        onChange={(e) => updateRef(ref.id, { type: e.target.value as BibliographyRef["type"] })}
                        className="shrink-0 rounded-md border bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {Object.entries(REF_TYPE_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      <Input
                        value={ref.title}
                        onChange={(e) => updateRef(ref.id, { title: e.target.value })}
                        placeholder="Título de la obra o fuente *"
                        className="flex-1"
                      />
                      <button
                        onClick={() => removeRef(ref.id)}
                        className="text-muted-foreground hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={ref.author ?? ""}
                        onChange={(e) => updateRef(ref.id, { author: e.target.value })}
                        placeholder="Autor(es)"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={ref.year?.toString() ?? ""}
                          onChange={(e) => updateRef(ref.id, { year: parseInt(e.target.value) || undefined })}
                          placeholder="Año"
                          type="number"
                          className="w-24"
                        />
                        <Input
                          value={ref.publisher ?? ""}
                          onChange={(e) => updateRef(ref.id, { publisher: e.target.value })}
                          placeholder="Editorial / Fuente"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={ref.url ?? ""}
                        onChange={(e) => updateRef(ref.id, { url: e.target.value })}
                        placeholder="URL (opcional)"
                        className="flex-1"
                      />
                      {ref.url && (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center justify-center h-9 w-9 rounded-md border hover:bg-accent transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      )}
                    </div>
                    <Input
                      value={ref.notes ?? ""}
                      onChange={(e) => updateRef(ref.id, { notes: e.target.value })}
                      placeholder="Notas propias sobre esta fuente (opcional)"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Footer con guardar */}
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(data)}>
            <Save className="h-4 w-4" />
            Guardar capítulo
          </Button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Página principal del proyecto
// ──────────────────────────────────────────────────────────────

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTopic, setEditTopic] = useState("");
  const [editPlatform, setEditPlatform] = useState<Project["platform"]>("instagram");
  const [editStatus, setEditStatus] = useState<Project["status"]>("activo");
  const [editEmoji, setEditEmoji] = useState("📚");

  useEffect(() => {
    const projects = loadProjects();
    setAllProjects(projects);
    const found = projects.find((p) => p.id === id);
    if (found) setProject(found);
  }, [id]);

  const persist = (updated: Project) => {
    const next = allProjects.map((p) => (p.id === updated.id ? updated : p));
    setAllProjects(next);
    setProject(updated);
    saveProjects(next);
  };

  const addChapter = () => {
    if (!project) return;
    const chapter = newChapter(project.chapters.length + 1);
    const updated: Project = {
      ...project,
      chapters: [...project.chapters, chapter],
      updatedAt: new Date().toISOString(),
    };
    persist(updated);
    setEditingChapterId(chapter.id);
  };

  const saveChapter = (chapter: ProjectChapter) => {
    if (!project) return;
    const updated: Project = {
      ...project,
      chapters: project.chapters.map((c) => (c.id === chapter.id ? chapter : c)),
      updatedAt: new Date().toISOString(),
    };
    persist(updated);
    setEditingChapterId(null);
  };

  const deleteChapter = (chapterId: string) => {
    if (!project) return;
    const updated: Project = {
      ...project,
      chapters: project.chapters
        .filter((c) => c.id !== chapterId)
        .map((c, i) => ({ ...c, order: i + 1 })),
      updatedAt: new Date().toISOString(),
    };
    persist(updated);
  };

  const moveChapter = (chapterId: string, direction: "up" | "down") => {
    if (!project) return;
    const idx = project.chapters.findIndex((c) => c.id === chapterId);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === project.chapters.length - 1) return;
    const chapters = [...project.chapters];
    const swap = direction === "up" ? idx - 1 : idx + 1;
    [chapters[idx], chapters[swap]] = [chapters[swap], chapters[idx]];
    persist({
      ...project,
      chapters: chapters.map((c, i) => ({ ...c, order: i + 1 })),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveProject = () => {
    if (!project) return;
    persist({
      ...project,
      title: editTitle,
      description: editDesc,
      topic: editTopic,
      platform: editPlatform,
      status: editStatus,
      coverEmoji: editEmoji,
      updatedAt: new Date().toISOString(),
    });
    setEditingProject(false);
  };

  const startEditProject = () => {
    if (!project) return;
    setEditTitle(project.title);
    setEditDesc(project.description);
    setEditTopic(project.topic);
    setEditPlatform(project.platform);
    setEditStatus(project.status);
    setEditEmoji(project.coverEmoji ?? "📚");
    setEditingProject(true);
  };

  const deleteProject = () => {
    if (!project || !confirm(`¿Eliminar el proyecto "${project.title}"? Esta acción no se puede deshacer.`)) return;
    const next = allProjects.filter((p) => p.id !== project.id);
    saveProjects(next);
    router.push("/projects");
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground text-sm">Proyecto no encontrado.</p>
      </div>
    );
  }

  const editingChapter = editingChapterId
    ? project.chapters.find((c) => c.id === editingChapterId)
    : null;

  const done = project.chapters.filter((c) => c.status === "listo").length;
  const total = project.chapters.length;

  return (
    <div>
      {/* Editor de capítulo (modal) */}
      {editingChapter && (
        <ChapterEditor
          chapter={editingChapter}
          onSave={saveChapter}
          onClose={() => setEditingChapterId(null)}
        />
      )}

      {/* Editor de proyecto (modal) */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold">Editar proyecto</h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Emoji</label>
                  <Input
                    value={editEmoji}
                    onChange={(e) => setEditEmoji(e.target.value)}
                    className="mt-1 w-16 text-center text-xl"
                    maxLength={2}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Título *</label>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Temática</label>
                <Input value={editTopic} onChange={(e) => setEditTopic(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Plataforma</label>
                  <select
                    value={editPlatform}
                    onChange={(e) => setEditPlatform(e.target.value as Project["platform"])}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Estado</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as Project["status"])}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSaveProject} disabled={!editTitle.trim()} className="flex-1">
                Guardar cambios
              </Button>
              <Button variant="outline" onClick={() => setEditingProject(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => router.push("/projects")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a proyectos
      </button>

      {/* Header del proyecto */}
      <div className="rounded-xl border bg-card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{project.coverEmoji ?? "📚"}</span>
            <div>
              <h1 className="text-xl font-bold leading-tight">{project.title}</h1>
              {project.topic && (
                <p className="text-sm text-muted-foreground mt-0.5">{project.topic}</p>
              )}
              {project.description && (
                <p className="text-sm mt-2 text-foreground/80">{project.description}</p>
              )}
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {total} {total === 1 ? "capítulo" : "capítulos"}
                </span>
                <span>·</span>
                <span>{PLATFORM_LABELS[project.platform]}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {STATUS_LABELS[project.status]}
                </span>
                {total > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-400">{done}/{total} listos</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={startEditProject}>
              <Edit3 className="h-3.5 w-3.5" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deleteProject}
              className="text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-500/50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Barra de progreso */}
        {total > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Progreso del proyecto</span>
              <span className="tabular-nums">{Math.round((done / total) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Capítulos */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Capítulos
        </h2>
        <Button size="sm" onClick={addChapter}>
          <Plus className="h-3.5 w-3.5" />
          Agregar capítulo
        </Button>
      </div>

      {project.chapters.length === 0 ? (
        <div className="rounded-xl border bg-card text-center py-14">
          <BookOpen className="h-9 w-9 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">Este proyecto todavía no tiene capítulos</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Cada capítulo tiene su propio guion, bibliografía, objetivos y conceptos clave.
          </p>
          <Button size="sm" onClick={addChapter}>
            <Plus className="h-3.5 w-3.5" />
            Crear primer capítulo
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {project.chapters.map((chapter, idx) => (
            <div
              key={chapter.id}
              className="rounded-xl border bg-card p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Orden y controles */}
                <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                  <span className="text-xs font-bold text-muted-foreground tabular-nums w-6 text-center">
                    {chapter.order}
                  </span>
                  <button
                    onClick={() => moveChapter(chapter.id, "up")}
                    disabled={idx === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveChapter(chapter.id, "down")}
                    disabled={idx === project.chapters.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm leading-tight">
                        {chapter.title || <span className="text-muted-foreground italic">Sin título</span>}
                      </h3>
                      {chapter.summary && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{chapter.summary}</p>
                      )}
                    </div>
                    <span className={cn(
                      "shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border",
                      CHAPTER_STATUS_COLORS[chapter.status]
                    )}>
                      {CHAPTER_STATUS_LABELS[chapter.status]}
                    </span>
                  </div>

                  {/* Stats rápidos */}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground flex-wrap">
                    {chapter.learningObjectives.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {chapter.learningObjectives.length} {chapter.learningObjectives.length === 1 ? "objetivo" : "objetivos"}
                      </span>
                    )}
                    {chapter.keyConcepts.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        {chapter.keyConcepts.length} {chapter.keyConcepts.length === 1 ? "concepto" : "conceptos"}
                      </span>
                    )}
                    {chapter.bibliography.length > 0 && (
                      <span className="flex items-center gap-1">
                        <BookMarked className="h-3 w-3" />
                        {chapter.bibliography.length} {chapter.bibliography.length === 1 ? "fuente" : "fuentes"}
                      </span>
                    )}
                    {chapter.estimatedDuration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {chapter.estimatedDuration}
                      </span>
                    )}
                    {chapter.scriptNotes && (
                      <span className="flex items-center gap-1">
                        <Edit3 className="h-3 w-3" />
                        Con guion
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingChapterId(chapter.id)}
                    className="h-8 px-2.5"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <button
                    onClick={() => deleteChapter(chapter.id)}
                    className="text-muted-foreground hover:text-red-400 transition-colors p-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
