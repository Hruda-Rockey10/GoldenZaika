import { NextResponse } from "next/server";
import { apiWrapper } from "@/utils/api-wrapper";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { verifyAuth, verifyAdmin } from "@/lib/auth/server-auth";

// Initialize Gemini
let genAI;
let model;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  }
} catch (e) {
  console.error("Gemini Init Error", e);
}

const SYSTEM_PROMPT = `
You are a Copywriting Expert for a premium food delivery brand called "Golden Zaika".
Your goal is to write mouth-watering, appetizing, and concise descriptions for menu items.
Tone: Premium, Authentic, Delicious, enticing.
Length: 1-2 sentences max.

You must respond ONLY with a JSON object in this exact format:
{
  "description": "Your generated description here"
}

Example:
Input: "Chicken Biryani"
Output:
{
  "description": "Aromatic basmati rice cooked with tender chicken pieces and authentic Indian spices, served with raita."
}
`;

export const POST = (req) =>
  apiWrapper(async (request) => {
    // Auth Check (Admins Only)
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const { name, category, isVeg } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    const prompt = `
    Product Name: ${name}
    Category: ${category || "General"}
    Dietary: ${isVeg ? "Vegetarian" : "Non-Vegetarian"}
    
    Write a short, premium description for this item in JSON format.
    `;

    let description =
      "Delicious and authentic dish prepared with fresh ingredients.";

    if (model) {
      try {
        const result = await model.generateContent([SYSTEM_PROMPT, prompt]);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response (Gemini might wrap it in markdown)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          description = parsed.description || description;
        } else {
          description = text.replace(/```json|```/g, "").trim();
        }
      } catch (e) {
        console.error("Gemini Error", e);
      }
    } else {
      description =
        "[Demo] Aromatic and delicious dish made with secret spices. (Add GEMINI_API_KEY to .env)";
    }

    return NextResponse.json({
      success: true,
      description: description,
    });
  }, req);
