import { NextResponse } from "next/server";
import { getDraft, getLatestDraftForCreator, saveDraft } from "@/lib/app-database";

const validTemplates = new Set(["model-card", "model-pane", "kol-card", "kol-pane"]);

function getRequiredSearchParam(url: URL, key: string) {
  const value = url.searchParams.get(key);
  return value?.trim() || null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const accountId = getRequiredSearchParam(url, "accountId");
  const creatorId = getRequiredSearchParam(url, "creatorId");
  const template = getRequiredSearchParam(url, "template");
  const latestForCreator = url.searchParams.get("latestForCreator") === "true";

  if (!creatorId || !template || !validTemplates.has(template) || (!accountId && !latestForCreator)) {
    return NextResponse.json({ error: "creatorId, valid template, and accountId or latestForCreator are required." }, { status: 400 });
  }

  const draft = latestForCreator
    ? await getLatestDraftForCreator(creatorId, template as "model-card")
    : await getDraft(accountId!, creatorId, template as "model-card");
  return NextResponse.json({ draft: draft ?? null });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    accountId?: string;
    creatorId?: string;
    template?: "model-card" | "model-pane" | "kol-card" | "kol-pane";
    data?: unknown;
  };

  if (!body.accountId || !body.creatorId || !body.template || !validTemplates.has(body.template)) {
    return NextResponse.json({ error: "accountId, creatorId, and valid template are required." }, { status: 400 });
  }

  const draft = await saveDraft({
    accountId: body.accountId,
    creatorId: body.creatorId,
    template: body.template,
    data: body.data ?? {},
  });

  return NextResponse.json({ draft });
}
