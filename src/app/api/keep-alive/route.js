import { NextResponse } from "next/server";

export const runtime = "nodejs"; // Force Node.js runtime to wake up the server (not Edge)

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Server is awake",
    timestamp: new Date().toISOString(),
  });
}
