import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

export type FormUser = {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  allowedCampaigns: string[];
  createdAt: string;
};

const usersFilePath = path.join(process.cwd(), "data", "users.json");

async function readUsers(): Promise<FormUser[]> {
  try {
    return JSON.parse(await fs.readFile(usersFilePath, "utf8")) as FormUser[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeUsers(users: FormUser[]) {
  await fs.mkdir(path.dirname(usersFilePath), { recursive: true });
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf8");
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  return derived.length === key.length / 2 && crypto.timingSafeEqual(derived, Buffer.from(key, "hex"));
}

export async function listUsers() { return readUsers(); }
export async function getUserById(id: string) { return (await readUsers()).find((user) => user.id === id) || null; }

export async function authenticateUser(username: string, password: string) {
  const user = (await readUsers()).find((item) => item.username.toLowerCase() === username.trim().toLowerCase());
  return user && verifyPassword(password, user.passwordHash) ? user : null;
}

export async function createUser(input: { username: string; displayName: string; password: string; allowedCampaigns: string[] }) {
  const users = await readUsers();
  if (users.some((user) => user.username.toLowerCase() === input.username.trim().toLowerCase())) throw new Error("USERNAME_EXISTS");
  const user: FormUser = { id: crypto.randomUUID(), username: input.username.trim(), displayName: input.displayName.trim() || input.username.trim(), passwordHash: hashPassword(input.password), allowedCampaigns: input.allowedCampaigns, createdAt: new Date().toISOString() };
  users.push(user);
  await writeUsers(users);
  return user;
}

export async function updateUser(id: string, input: { displayName: string; password?: string; allowedCampaigns: string[] }) {
  const users = await readUsers();
  const user = users.find((item) => item.id === id);
  if (!user) return null;
  user.displayName = input.displayName.trim() || user.username;
  user.allowedCampaigns = input.allowedCampaigns;
  if (input.password) user.passwordHash = hashPassword(input.password);
  await writeUsers(users);
  return user;
}

export async function deleteUser(id: string) {
  const users = await readUsers();
  await writeUsers(users.filter((user) => user.id !== id));
}

export function canAccessCampaign(user: FormUser, slug: string) { return user.allowedCampaigns.includes("*") || user.allowedCampaigns.includes(slug); }