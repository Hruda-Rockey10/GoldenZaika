import { NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase/admin";
import { verifyAuth, verifyAdmin } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";

export const POST = (req) =>
  apiWrapper(async (request) => {
    // Auth Check
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const formData = await request.formData();
    const file = formData.get("image");
    const category = formData.get("category") || "general";

    if (!file) {
      throw new Error("No file provided");
    }

    // Validation
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      throw new Error("File size exceeds 5MB limit");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Get original file extension
    const fileExtension = file.name.split(".").pop() || "jpg";

    // Get product name from form data or use original filename
    const productName = formData.get("productName") || file.name.split(".")[0];

    // Sanitize product name for filename (remove special characters, replace spaces)
    const sanitizedProductName = productName
      .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .toLowerCase();

    const filename = `food-images/${category}/${sanitizedProductName}.${fileExtension}`;
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(filename);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make public or generate signed URL
    // For simplicity with Firebase Storage, we can use the authenticated download token method
    // or make it public if bucket allows.
    // Here we assume standard public access pattern or use getSignedUrl for long expiry.

    // Attempt to make public (requires IAM permission)
    try {
      await fileRef.makePublic();
    } catch (e) {
      console.warn(
        "Make public failed, ensure IAM permissions. Using signed URL fallback."
      );
      // If makePublic fails, we can return a signed URL or constructed URL if we know it's public.
    }

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    // Alternative: Firebase Storage Download URL pattern (if not public bucket)
    // https://firebasestorage.googleapis.com/v0/b/[bucket]/o/[path]?alt=media
    // But path needs to be URL encoded.
    const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${
      bucket.name
    }/o/${encodeURIComponent(filename)}?alt=media`;

    return NextResponse.json({
      success: true,
      imageUrl: firebaseUrl, // Using Firebase URL format usually works better with rules
      data: firebaseUrl,
    });
  }, req);
