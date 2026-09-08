import type { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "selecthub_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "development-only-change-me";
}

async function signature(value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_EMAIL);
}

export function isValidAdminCredentials(email: string, password: string) {
  return isAdminConfigured() && email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD;
}

export async function setAdminSession(response: NextResponse) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const value = `${expires}.${await signature(String(expires))}`;
  response.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearAdminSession(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", { httpOnly: true, expires: new Date(0), path: "/" });
}

export async function hasAdminSession(request: NextRequest) {
  const raw = request.cookies.get(COOKIE_NAME)?.value;
  if (!raw) return false;
  const [expires, provided] = raw.split(".");
  if (!expires || !provided || Number(expires) < Math.floor(Date.now() / 1000)) return false;
  const expected = await signature(expires);
  if (provided.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= provided.charCodeAt(index) ^ expected.charCodeAt(index);
  return difference === 0;
}

export function requireAdmin(request: NextRequest, response: NextResponse) {
  if (!hasAdminSession(request)) {
    response.cookies.set(COOKIE_NAME, "", { httpOnly: true, expires: new Date(0), path: "/" });
    return false;
  }
  return true;
}
