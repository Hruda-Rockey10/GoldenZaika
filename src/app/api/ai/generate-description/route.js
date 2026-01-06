import { NextResponse } from "next/server";
import { apiWrapper } from "@/utils/api-wrapper";
import OpenAI from "openai";
import { verifyAuth, verifyAdmin } from "@/lib/auth/server-auth";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Golden Zaika",
  },
});
const MODELS = [
  "xiaomi/mimo-v2-flash:free",
  "mistralai/devstral-2512:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "google/gemini-2.0-flash-exp:free",
];

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
    let modelUsed = "fallback";

    try {
      let text = null;

      // Retry Logic with Multiple Models
      for (const model of MODELS) {
        try {
          console.log(`🤖 [DESCRIPTION] Calling Model: ${model}`);
          const completion = await openai.chat.completions.create({
            model: model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
          });

          text = completion.choices[0].message.content;
          if (text) {
            console.log(`✅ [DESCRIPTION] Success with ${model}`);
            modelUsed = model;
            break; // Success!
          }
        } catch (modelError) {
          console.warn(
            `⚠️ [DESCRIPTION] Model ${model} failed:`,
            modelError.message
          );
          // Continue to next model
        }
      }

      if (!text) throw new Error("All AI models failed");

      // text is populated above

      // Extract JSON from response (Some models might still wrap it)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        description = parsed.description || description;
      } else {
        // Fallback if no JSON found
        description = text.replace(/```json|```/g, "").trim();
      }
    } catch (e) {
      console.error("AI Generation Error", e);
      modelUsed = "error-fallback";
    }

    return NextResponse.json({
      success: true,
      description: description,
      model: modelUsed,
    });
  }, req);
