import { promises as fs } from "fs";
import path from "path";
import { createId } from "@/lib/cms/id";
import { hashPassword, verifyPassword } from "./password";
import type { AdminUser, UserRole } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "admin-users.json");

let memoryUsers: AdminUser[] | null = null;

function canPersistUsers(): boolean {
  return process.env.NODE_ENV === "development" && !process.env.VERCEL;
}

async function ensureDataDir() {
  if (!canPersistUsers()) return;
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readUsersFile(): Promise<AdminUser[]> {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf-8");
    return JSON.parse(raw) as AdminUser[];
  } catch {
    return [];
  }
}

async function writeUsersFile(users: AdminUser[]): Promise<void> {
  if (!canPersistUsers()) {
    memoryUsers = users;
    return;
  }
  await ensureDataDir();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  memoryUsers = users;
}

async function buildDefaultUsers(): Promise<AdminUser[]> {
  const now = new Date().toISOString();
  const ownerEmail = process.env.ADMIN_EMAIL ?? "admin@neonbright.ma";
  const ownerPassword = process.env.ADMIN_PASSWORD ?? "neonbright-admin";
  const staffEmail = process.env.STAFF_EMAIL ?? "staff@neonbright.ma";
  const staffPassword = process.env.STAFF_PASSWORD ?? "neonbright-staff";

  return [
    {
      id: createId("usr"),
      email: ownerEmail.toLowerCase(),
      passwordHash: await hashPassword(ownerPassword),
      role: "owner",
      name: "Owner",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId("usr"),
      email: staffEmail.toLowerCase(),
      passwordHash: await hashPassword(staffPassword),
      role: "staff",
      name: "Staff",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export async function getUsers(): Promise<AdminUser[]> {
  if (memoryUsers?.length) return memoryUsers;

  let users = await readUsersFile();
  if (users.length === 0) {
    users = await buildDefaultUsers();
    await writeUsersFile(users);
  } else {
    memoryUsers = users;
  }

  return users;
}

export async function getUserById(id: string): Promise<AdminUser | null> {
  const users = await getUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function getUserByEmail(email: string): Promise<AdminUser | null> {
  const normalized = email.toLowerCase().trim();
  const users = await getUsers();
  return users.find((u) => u.email === normalized) ?? null;
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<AdminUser | null> {
  const user = await getUserByEmail(email);
  if (!user || !user.active) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  return valid ? user : null;
}

export async function createUser(input: {
  email: string;
  password: string;
  role: UserRole;
  name: string;
}): Promise<AdminUser> {
  const users = await getUsers();
  const normalized = input.email.toLowerCase().trim();
  if (users.some((u) => u.email === normalized)) {
    throw new Error("Email already in use");
  }

  const now = new Date().toISOString();
  const user: AdminUser = {
    id: createId("usr"),
    email: normalized,
    passwordHash: await hashPassword(input.password),
    role: input.role,
    name: input.name,
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  const next = [...users, user];
  await writeUsersFile(next);
  return user;
}
