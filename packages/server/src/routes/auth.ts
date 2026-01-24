import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { JWT_SECRET } from "../middleware/auth";
import type { ApiResponse } from "shared";

export const authRoutes = new Hono();

interface LoginPayload {
  username: string;
  password: string;
}

interface UserData {
  username: string;
}

// POST /login - Authenticate user and set JWT cookie
authRoutes.post("/login", async (c) => {
  let body: LoginPayload;

  try {
    body = await c.req.json<LoginPayload>();
  } catch {
    return c.json<ApiResponse>(
      { success: false, message: "Cerere invalida" },
      400
    );
  }

  const { username, password } = body;

  if (!username || !password) {
    return c.json<ApiResponse>(
      { success: false, message: "Username si parola sunt obligatorii" },
      400
    );
  }

  // Find user by username
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username));

  if (!user) {
    return c.json<ApiResponse>(
      { success: false, message: "Credentiale invalide" },
      401
    );
  }

  // Check if user is active
  if (!user.activ) {
    return c.json<ApiResponse>(
      { success: false, message: "Contul este dezactivat" },
      401
    );
  }

  // Verify password using Bun.password
  const isValidPassword = await Bun.password.verify(password, user.passwordHash);

  if (!isValidPassword) {
    return c.json<ApiResponse>(
      { success: false, message: "Credentiale invalide" },
      401
    );
  }

  // Create JWT payload with 24h expiration
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 86400; // 24 hours

  const payload = {
    sub: user.id,
    username: user.username,
    iat: now,
    exp,
  };

  // Sign JWT token
  const token = await sign(payload, JWT_SECRET);

  // Set HttpOnly cookie
  const isProduction = process.env.NODE_ENV === "production";
  setCookie(c, "token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "Lax",
    path: "/",
    maxAge: 86400, // 24 hours in seconds
  });

  return c.json<ApiResponse<UserData>>({
    success: true,
    data: { username: user.username },
  });
});

// POST /logout - Clear JWT cookie
authRoutes.post("/logout", (c) => {
  deleteCookie(c, "token", {
    path: "/",
  });

  return c.json<ApiResponse>({ success: true });
});

// GET /me - Get current user from JWT
authRoutes.get("/me", (c) => {
  // JWT payload is set by authMiddleware
  const payload = c.get("jwtPayload") as { sub: number; username: string } | undefined;

  if (!payload) {
    return c.json<ApiResponse>(
      { success: false, message: "Neautentificat" },
      401
    );
  }

  return c.json<ApiResponse<UserData>>({
    success: true,
    data: { username: payload.username },
  });
});
