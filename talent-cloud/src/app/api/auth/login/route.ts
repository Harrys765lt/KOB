import { NextResponse } from "next/server";
import { authenticateAccount } from "@/lib/app-database";

export async function POST(request: Request) {
  const body = (await request.json()) as { identifier?: string; password?: string };

  if (!body.identifier || !body.password) {
    return NextResponse.json({ error: "Identifier and password are required." }, { status: 400 });
  }

  const account = await authenticateAccount(body.identifier, body.password);

  if (!account) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  return NextResponse.json({ account });
}
