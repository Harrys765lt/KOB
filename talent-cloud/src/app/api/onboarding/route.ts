import { NextResponse } from "next/server";
import { createAccount } from "@/lib/app-database";
import { UserRole } from "@/lib/types";

const roleMap: Record<string, UserRole> = {
  brand: "brand_subscriber",
  creator: "free_creator",
  kol: "free_creator",
  model: "free_creator",
};

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
    onboardingRole?: string;
  };

  if (!body.name?.trim() || !body.email?.trim() || !body.password?.trim()) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  const onboardingRole = body.onboardingRole?.toLowerCase() || "creator";
  const role = roleMap[onboardingRole] ?? "free_creator";

  try {
    const account = await createAccount({
      name: body.name,
      email: body.email,
      password: body.password,
      role,
      talentType: onboardingRole === "brand" ? "brand" : onboardingRole === "kol" ? "kol" : "model",
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create account.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
