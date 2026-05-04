"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Plus, ChevronRight, Search, FolderOpen,
  CheckCircle2, Clock, PauseCircle, Archive, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Project, newProject, newId,
  PLATFORM_LABELS, STATUS_LABELS,
  CHAPTER_STATUS_LABELS,
} from "@/lib/projects";

const LS_KEY = "nemef_projects_v1";

function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(projects));
}

const STATUS_ICONS: Record<Project["status"], React.ComponentType<{ className?: string }>> = {
  activo: Clock,
  pausado: PauseCircle,
  completado: CheckCircle2,
  archivado: Archive,
};

const STATUS_COLORS: Record<Project["status"], string> = {
  activo: "text-blue-400",
  pausado: "text-amber-400",
  completado: "text-emerald-400",
  archivado: "text-muted-foreground",
};

function chapterProgress(project: Project): { done: number; total: number } {
  const total = project.chapters.length;
  const done = project.chapters.filter((c) => c.status === "listo").length;
  return { done, total };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Project["status"] | "todos">("todos");
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPlatform, setNewPlatform] = useState<Project["platform"]>("instagram");

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  const filtered = projects
    .filter((p) =>
      (filterStatus === "todos" || p.status === filterStatus) &&
      (search === "" ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.topic.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const project = newProject({
      id: newId(),
      title: newTitle.trim(),
      topic: newTopic.trim(),
      description: newDesc.trim(),
      platform: newPlatform,
    });
    const updated = [project, ...projects];
    setProjects(updated);
    saveProjects(updated);
    setCreating(false);
    setNewTitle("");
    setNewTopic("");
    setNewDesc("");
    router.push(`/projects/${project.id}`);
  };

  const statusFilters: Array<{ key: Project["status"] | "todos"; label: string }> = [
    { key: "todos", label: "Todos" },
    { key: "activo", label: "Activos" },
    { key: "pausado", label: "Pausados" },
    { key: "completado", label: "Completados" },
    { key: "archivado", label: "Archivados" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Laboratorio de Proyectos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Desarrollá contenido financiero estructurado, con bibliografía, objetivos y guion para cada capítulo.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="shrink-0">
          <Plus className="h-4 w-4" />
          Nuevo proyecto
        </Button>
      </div>

      {/* Modal de nuevo proyecto */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Nuevo proyecto</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Un proyecto agrupa capítulos de contenido sobre un mismo eje temático.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Título del proyecto *</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Finanzas personales para jóvenes"
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Temática / Eje central</label>
                <Input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Ej: Ahorro, inversión y presupuesto"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Descripción breve</label>
                <Input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="¿Qué vas a enseñar en este proyecto?"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Plataforma principal</label>
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value as Project["platform"])}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleCreate} disabled={!newTitle.trim()} className="flex-1">
                Crear proyecto
              </Button>
              <Button variant="outline" onClick={() => setCreating(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar proyectos..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                filterStatus === f.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground border-border hover:bg-accent"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de proyectos */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-card">
          <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">
            {projects.length === 0 ? "Todavía no creaste ningún proyecto" : "No hay proyectos que coincidan con el filtro"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {projects.length === 0
              ? "Creá tu primer proyecto de contenido educativo financiero"
              : "Probá cambiando los filtros de búsqueda"}
          </p>
          {projects.length === 0 && (
            <Button onClick={() => setCreating(true)} size="sm">
              <Plus className="h-4 w-4" />
              Crear primer proyecto
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => {
            const { done, total } = chapterProgress(project);
            const StatusIcon = STATUS_ICONS[project.status];
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <button
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="text-left rounded-xl border bg-card p-5 hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{project.coverEmoji ?? "📚"}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
                </div>
                <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2">{project.title}</h3>
                {project.topic && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{project.topic}</p>
                )}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {total} {total === 1 ? "capítulo" : "capítulos"}
                  </span>
                  <span>·</span>
                  <span>{PLATFORM_LABELS[project.platform]}</span>
                </div>
                {total > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Progreso</span>
                      <span className="tabular-nums">{done}/{total} listos</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className={cn("flex items-center gap-1 text-[11px] font-medium", STATUS_COLORS[project.status])}>
                  <StatusIcon className="h-3 w-3" />
                  {STATUS_LABELS[project.status]}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
