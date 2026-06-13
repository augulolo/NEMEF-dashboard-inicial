import { NextResponse } from "next/server";

// Dispara el pipeline de NEMEF Autopilot (GitHub Actions) desde el dashboard.
// Requiere GITHUB_DISPATCH_TOKEN (PAT fino con permiso Actions: read/write
// sobre el repo augulolo/nemef-autopilot).
const REPO = process.env.NEMEF_AUTOPILOT_REPO ?? "augulolo/nemef-autopilot";
const WORKFLOW = "diario.yml";

export async function POST(req: Request) {
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Falta GITHUB_DISPATCH_TOKEN en el entorno del dashboard." },
      { status: 500 }
    );
  }

  let body: { topic?: string; video?: boolean; investigar?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* body opcional */
  }
  const comando = (body.topic || "radar").trim();

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          comando,
          video: body.video ? "true" : "false",
          investigar: body.investigar ? "true" : "false",
        },
      }),
    }
  );

  if (res.status === 204) {
    return NextResponse.json({ ok: true, comando });
  }
  const detail = await res.text();
  return NextResponse.json(
    { error: `GitHub respondio ${res.status}`, detail: detail.slice(0, 300) },
    { status: 502 }
  );
}
