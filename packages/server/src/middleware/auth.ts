import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import type { MiddlewareHandler } from "hono";
import type { ApiResponse } from "shared";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

/**
 * JWT authentication middleware
 * Verifies JWT token from "token" cookie
 * Skips auth for /api/auth/login, /api/auth/logout, /api/health paths
 */
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const path = c.req.path;

  // Skip auth for login, logout, and health endpoints
  if (
    path === "/api/auth/login" ||
    path === "/api/auth/logout" ||
    path.startsWith("/api/health")
  ) {
    return next();
  }

  // Get token from cookie
  const token = getCookie(c, "token");

  if (!token) {
    return c.json<ApiResponse>(
      { success: false, message: "Neautentificat" },
      401
    );
  }

  try {
    // Verify JWT token (HS256 algorithm)
    const payload = await verify(token, JWT_SECRET, "HS256");

    // Store payload for use in routes
    c.set("jwtPayload", payload);

    return next();
  } catch {
    return c.json<ApiResponse>(
      { success: false, message: "Token invalid sau expirat" },
      401
    );
  }
};

export { JWT_SECRET };
