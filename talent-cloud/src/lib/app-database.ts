import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import type { UserRole } from "@/lib/types";

export type AccountSession = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  talentType?: "model" | "kol" | "creator" | "brand";
  creatorSlug?: string;
};

type StoredAccount = AccountSession & {
  password: string;
  createdAt: string;
  updatedAt: string;
};

type DraftRecord = {
  accountId: string;
  creatorId: string;
  template: "model-card" | "model-pane" | "kol-card" | "kol-pane";
  data: unknown;
  updatedAt: string;
};

type AppDatabase = {
  accounts: StoredAccount[];
  drafts: DraftRecord[];
};

const DB_PATH = path.join(process.cwd(), "data", "talent-cloud-db.json");
let writeQueue = Promise.resolve();

const nowIso = () => new Date().toISOString();

const seedDatabase: AppDatabase = {
  accounts: [
    {
      id: "acct-admin",
      name: "Ava Lim",
      email: "admin@boxin.my",
      password: "admin123",
      role: "admin",
      talentType: "brand",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "acct-brand",
      name: "Brand Demo",
      email: "brand@boxin.my",
      password: "brand123",
      role: "brand_subscriber",
      talentType: "brand",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "acct-ee-ean",
      name: "EE-EAN",
      email: "creator@boxin.my",
      password: "creator123",
      role: "free_creator",
      talentType: "model",
      creatorSlug: "ee-ean",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ],
  drafts: [],
};

function toSession(account: StoredAccount): AccountSession {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    talentType: account.talentType,
    creatorSlug: account.creatorSlug,
  };
}

async function ensureDatabase() {
  await mkdir(path.dirname(DB_PATH), { recursive: true });

  try {
    await readFile(DB_PATH, "utf8");
  } catch {
    await writeFile(DB_PATH, JSON.stringify(seedDatabase, null, 2), "utf8");
  }
}

function parseDatabase(raw: string): AppDatabase {
  try {
    return JSON.parse(raw) as AppDatabase;
  } catch (error) {
    const trimmed = raw.trimEnd();
    const firstJsonEnd = findFirstJsonObjectEnd(trimmed);

    if (firstJsonEnd > 0) {
      try {
        return JSON.parse(trimmed.slice(0, firstJsonEnd)) as AppDatabase;
      } catch {
        // Fall through to the smaller trailing repair below.
      }
    }

    for (let charsToRemove = 1; charsToRemove <= 128; charsToRemove += 1) {
      try {
        return JSON.parse(trimmed.slice(0, -charsToRemove)) as AppDatabase;
      } catch {
        // Keep trying a short trailing repair window before failing with the original parse error.
      }
    }

    throw error;
  }
}

function findFirstJsonObjectEnd(raw: string) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return index + 1;
      }
    }
  }

  return -1;
}

export async function readDatabase(): Promise<AppDatabase> {
  await ensureDatabase();
  const raw = await readFile(DB_PATH, "utf8");
  const database = parseDatabase(raw);

  if (JSON.stringify(database, null, 2) !== raw) {
    await writeDatabase(database);
  }

  return database;
}

async function writeDatabase(database: AppDatabase) {
  writeQueue = writeQueue.then(async () => {
    await mkdir(path.dirname(DB_PATH), { recursive: true });
    const tempPath = `${DB_PATH}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tempPath, JSON.stringify(database, null, 2), "utf8");
    await rename(tempPath, DB_PATH);
  });

  await writeQueue;
}

export async function authenticateAccount(identifier: string, password: string) {
  const database = await readDatabase();
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const normalizedPassword = password.trim();
  const account = database.accounts.find((item) => {
    const aliases = [item.email.toLowerCase(), item.id.toLowerCase()];
    if (item.id === "acct-admin") aliases.push("admin123");
    if (item.id === "acct-brand") aliases.push("brand123");
    if (item.id === "acct-ee-ean") aliases.push("creator123");
    return aliases.includes(normalizedIdentifier) && item.password === normalizedPassword;
  });

  return account ? toSession(account) : null;
}

export async function createAccount(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  talentType?: AccountSession["talentType"];
}) {
  const database = await readDatabase();
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = database.accounts.find((item) => item.email.toLowerCase() === normalizedEmail);

  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const timestamp = nowIso();
  const account: StoredAccount = {
    id: `acct-${Date.now().toString(36)}`,
    name: input.name.trim(),
    email: normalizedEmail,
    password: input.password,
    role: input.role,
    talentType: input.talentType,
    creatorSlug: input.role === "free_creator" || input.role === "paid_creator" ? "ee-ean" : undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  database.accounts.push(account);
  await writeDatabase(database);
  return toSession(account);
}

export async function getDraft(accountId: string, creatorId: string, template: DraftRecord["template"]) {
  const database = await readDatabase();
  return database.drafts.find(
    (item) => item.accountId === accountId && item.creatorId === creatorId && item.template === template,
  );
}

export async function getLatestDraftForCreator(creatorId: string, template: DraftRecord["template"]) {
  const database = await readDatabase();
  return database.drafts
    .filter((item) => item.creatorId === creatorId && item.template === template)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
}

export async function saveDraft(input: Omit<DraftRecord, "updatedAt">) {
  const database = await readDatabase();
  const timestamp = nowIso();
  const index = database.drafts.findIndex(
    (item) =>
      item.accountId === input.accountId && item.creatorId === input.creatorId && item.template === input.template,
  );

  const nextDraft: DraftRecord = {
    ...input,
    updatedAt: timestamp,
  };

  if (index >= 0) {
    database.drafts[index] = nextDraft;
  } else {
    database.drafts.push(nextDraft);
  }

  await writeDatabase(database);
  return nextDraft;
}
