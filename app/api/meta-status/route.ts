import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.META_ACCESS_TOKEN;
  const igId  = process.env.META_IG_ACCOUNT_ID;

  if (!token || !igId) {
    return NextResponse.json({ configured: false });
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${igId}?fields=username,followers_count&access_token=${token}`,
      { cache: "no-store" }
    );
    const json = await res.json();
    if (json.error) {
      return NextResponse.json({ configured: true, valid: false, error: json.error.message });
    }
    return NextResponse.json({
      configured: true,
      valid: true,
      username: json.username,
      followers: json.followers_count,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ configured: true, valid: false, error: msg });
  }
}
