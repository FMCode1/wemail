import { cookies } from "next/headers";

const SESSION_COOKIE = "wemail_user_id";

export async function getCurrentUserId() {
  const cookieStore = await cookies();

  return cookieStore.get(SESSION_COOKIE)?.value || null;
}

export async function setCurrentUserId(userId: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearCurrentUserId() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);
}