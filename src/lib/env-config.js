const requiredServerEnvs = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

const requiredClientEnvs = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_RAZORPAY_KEY_ID",
];

export function validateEnv() {
  const missingServer = requiredServerEnvs.filter((env) => !process.env[env]);

  const missingClient = requiredClientEnvs.filter((env) => !process.env[env]);

  if (missingServer.length > 0) {
    throw new Error(
      `Missing Required Server Environment Variables: ${missingServer.join(
        ", "
      )}`
    );
  }

  if (missingClient.length > 0) {
    // Usually client envs might be missing on server build time if not careful,
    // but acceptable to throw if critical.
    console.warn(
      `Missing Required Client Environment Variables: ${missingClient.join(
        ", "
      )}`
    );
  }
}
