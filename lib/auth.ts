import type { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "selecthub_admin_session";
const USER_COOKIE_NAME = "selecthub_form_user_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "development-only-change-me";
}

function userSecret() {
  return process.env.FORM_SESSION_SECRET || process.env.FORM_USER_PASSWORD || "development-only-change-me";
}

async function signature(value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function userSignature(value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(userSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_EMAIL);
}

export function isValidAdminCredentials(email: string, password: string) {
  return isAdminConfigured() && email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD;
}

export function isFormUserConfigured() {
  return Boolean(process.env.FORM_USER_EMAIL && process.env.FORM_USER_PASSWORD);
}

export function isValidFormUserCredentials(email: string, password: string) {
  return isFormUserConfigured() && email === process.env.FORM_USER_EMAIL && password === process.env.FORM_USER_PASSWORD;
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

export async function setFormUserSession(response: NextResponse, userId = "legacy") {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${userId}.${expires}`;
  const value = `${payload}.${await userSignature(payload)}`;
  response.cookies.set(USER_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearFormUserSession(response: NextResponse) {
  response.cookies.set(USER_COOKIE_NAME, "", { httpOnly: true, expires: new Date(0), path: "/" });
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

export async function hasFormUserSession(request: NextRequest) {
  return Boolean(await getFormUserId(request));
}

export async function getFormUserId(request: { cookies: { get(name: string): { value: string } | undefined } }) {
  const raw = request.cookies.get(USER_COOKIE_NAME)?.value;
  if (!raw) return null;
  const [userId, expires, provided] = raw.split(".");
  const payload = `${userId}.${expires}`;
  if (!userId || !expires || !provided || Number(expires) < Math.floor(Date.now() / 1000)) return null;
  const expected = await userSignature(payload);
  if (provided.length !== expected.length) return null;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= provided.charCodeAt(index) ^ expected.charCodeAt(index);
  return difference === 0 ? userId : null;
}

export function requireAdmin(request: NextRequest, response: NextResponse) {
  if (!hasAdminSession(request)) {
    response.cookies.set(COOKIE_NAME, "", { httpOnly: true, expires: new Date(0), path: "/" });
    return false;
  }
  return true;
}
