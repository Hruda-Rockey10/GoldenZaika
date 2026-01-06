import { adminAuth, adminDb } from "../firebase/admin";
import { logger } from "../logger/logger";
import { redis } from "@/lib/redis/upstash"; // Import Redis

/**
 * Verify ID Token from Authorization header
 * @param {Request} request
 * @returns {Promise<import('firebase-admin/auth').DecodedIdToken>}
 */
export async function verifyAuth(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: No token provided");
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    // It extracts the data inside the token
    // (like uid, email, email_verified) and gives it back to you as the decodedToken object.
    return decodedToken;
  } catch (error) {
    logger.error("verifyAuth error", error);
    throw new Error("Unauthorized: Invalid token");
  }
}

/**
 * Verify User Role
 * @param {string} uid
 * @param {string|string[]} requiredRole - Single role or array of allowed roles
 */
export async function verifyRole(uid, requiredRole) {
  try {
    const cacheKey = `user:role:${uid}`;
    let userRole = null;

    // 1. Try Cache
    try {
      userRole = await redis.get(cacheKey);
    } catch (e) {
      console.warn("Redis GET role error", e);
    }

    if (!userRole) {
      // 2. Fetch from DB
      const userDoc = await adminDb.collection("users").doc(uid).get();

      if (!userDoc.exists) {
        throw new Error("Forbidden: User not found");
      }

      userRole = userDoc.data()?.role || "user";

      // 3. Set Cache (15 mins)
      // Longer TTL is fine, roles rarely change.
      // Force relogin or manual cache clear if role changes.
      try {
        await redis.set(cacheKey, userRole, { ex: 900 });
      } catch (e) {
        console.warn("Redis SET role error", e);
      }
    }

    const allowedRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];

    if (!allowedRoles.includes(userRole)) {
      throw new Error(
        `Forbidden: Insufficient permissions. Required: ${allowedRoles.join(
          " or "
        )}`
      );
    }

    return userRole;
  } catch (error) {
    logger.error("verifyRole error", error);
    throw error;
  }
}

/**
 * Verify Admin (Wrapper for backward compatibility)
 * @param {string} uid
 */
export async function verifyAdmin(uid) {
  return verifyRole(uid, "admin");
}
