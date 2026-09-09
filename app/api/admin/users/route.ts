import { NextRequest, NextResponse } from "next/server";
import { createUser, deleteUser, listUsers, updateUser } from "@/lib/users";

function publicUser(user: Awaited<ReturnType<typeof listUsers>>[number]) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function GET() {
  return NextResponse.json({ success: true, users: (await listUsers()).map(publicUser) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { username?: string; displayName?: string; password?: string; allowedCampaigns?: string[] };
    if (!body.username || !body.password || body.password.length < 8) return NextResponse.json({ success: false, message: "Username and a password of at least 8 characters are required." }, { status: 400 });
    const user = await createUser({ username: body.username, displayName: body.displayName || "", password: body.password, allowedCampaigns: body.allowedCampaigns || [] });
    return NextResponse.json({ success: true, user: publicUser(user) });
  } catch (error) {
    if (error instanceof Error && error.message === "USERNAME_EXISTS") return NextResponse.json({ success: false, message: "That username is already in use." }, { status: 409 });
    return NextResponse.json({ success: false, message: "Unable to create user." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json() as { id?: string; displayName?: string; password?: string; allowedCampaigns?: string[] };
  if (!body.id) return NextResponse.json({ success: false, message: "User id is required." }, { status: 400 });
  const user = await updateUser(body.id, { displayName: body.displayName || "", password: body.password, allowedCampaigns: body.allowedCampaigns || [] });
  return user ? NextResponse.json({ success: true, user: publicUser(user) }) : NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, message: "User id is required." }, { status: 400 });
  await deleteUser(id);
  return NextResponse.json({ success: true });
}