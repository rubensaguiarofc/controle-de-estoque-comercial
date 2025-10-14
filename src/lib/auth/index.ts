import { join } from "path";
import { Low, JSONFile } from "lowdb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";

type User = { id: string; email: string; passwordHash: string; name?: string };

const dataDir = join(process.cwd(), "./data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbFile = join(dataDir, "users.json");
// lowdb typings can be picky across versions; cast to any to keep this file workable in the
// existing project TS config.
const adapter: any = new JSONFile<{ users: User[] }>(dbFile);
// Provide default data as second arg for Node/server builds
const db: any = new Low(adapter as any, { users: [] });

async function ensureDb() {
  await db.read();
  db.data = db.data || { users: [] };
  await db.write();
}

export async function createUser(email: string, password: string, name?: string) {
  await ensureDb();
  const exists = (db.data!.users as User[]).find((u: User) => u.email === email.toLowerCase());
  if (exists) throw new Error("User already exists");
  const passwordHash = await bcrypt.hash(password, 10);
  const user: User = { id: Date.now().toString(36), email: email.toLowerCase(), passwordHash, name };
  (db.data!.users as User[]).push(user);
  await db.write();
  return { id: user.id, email: user.email, name: user.name };
}

export async function verifyUser(email: string, password: string) {
  await ensureDb();
  const user = (db.data!.users as User[]).find((u: User) => u.email === email.toLowerCase());
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, email: user.email, name: user.name };
}

const jwtSecret = process.env.AUTH_JWT_SECRET || "dev-secret";

export function signJwt(payload: object) {
  return jwt.sign(payload, jwtSecret, { expiresIn: "7d" });
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, jwtSecret) as any;
  } catch (e) {
    return null;
  }
}

export async function getUserById(id: string) {
  await ensureDb();
  const user = (db.data!.users as User[]).find((u: User) => u.id === id);
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name };
}

export default { createUser, verifyUser, signJwt, verifyJwt };
