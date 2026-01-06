import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import OpenAI from "openai";
import { redis } from "@/lib/redis/upstash"; // Import Redis
import crypto from "crypto";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Golden Zaika",
  },
});
const MODELS = [
  "mistralai/devstral-2512:free",
  "xiaomi/mimo-v2-flash:free",
  "google/gemini-2.0-flash-exp:free",
  "openai/gpt-oss-120b:free",
];

const SYSTEM_PROMPT = `
You are a Smart Nutrition Advisor for a food delivery app. 
Your goal is to analyze the nutritional content of a meal and provide helpful, non-medical advice.
Focus on:
1. Balance (Protein/Carbs/Fat ratio)
2. Missing components (e.g. "Low on protein", "High carbs")
3. Smart suggestions to improve the meal (specific items from the menu if possible, or general types of food)

Output Format: JSON
{
  "analysis": "Brief summary of the meal's balance.",
  "score": "Number 1-10",
  "macros": { "protein": "Low/Good/High", "carbs": "Low/Good/High", "fat": "Low/Good/High" },
  "suggestions": ["Tip 1", "Tip 2"],
  "estimated_nutrition": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
}
If exact data is missing, please provide your best estimates in "estimated_nutrition".
Keep it concise and friendly.
`;

export const POST = (req) =>
  apiWrapper(async (request) => {
    const { items, userProfile } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Calculate Totals (Server-side calculation for accuracy)
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    const breakdown = items.map((item) => {
      const qty = item.quantity || 1;

      // Handle both top-level (new) and nested (legacy) nutrition data
      const iCals = item.calories || item.nutrition?.calories || 0;
      const iProt = item.protein || item.nutrition?.protein || 0;
      const iCarbs = item.carbs || item.nutrition?.carbs || 0;
      const iFat = item.fat || item.nutrition?.fat || 0;

      const cals = iCals * qty;
      const prot = iProt * qty;
      const carbs = iCarbs * qty;
      const fat = iFat * qty;

      totalCalories += cals;
      totalProtein += prot;
      totalCarbs += carbs;
      totalFat += fat;

      return `${qty}x ${item.name} (${cals}kcal, P:${prot}g, C:${carbs}g, F:${fat}g)`;
    });

    // Generate Cache Key
    // Hash the breakdown string + user context (simple version) to handle identical carts
    const contentString = breakdown.sort().join("|");
    const hash = crypto.createHash("md5").update(contentString).digest("hex");
    const cacheKey = `ai:nutrition:${hash}`;

    let aiResponse = null;
    let modelUsed = "redis-cache";

    // 1. Check Redis
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log("🟢 [NUTRITION] Serving from Redis Cache");
        // Backward compatibility check for old cache format
        if (cachedData.analysis) {
          aiResponse = cachedData;
          modelUsed = "redis-cache (legacy)";
        } else {
          aiResponse = cachedData.aiResponse;
          modelUsed = cachedData.modelUsed || "redis-cache";
        }
      }
    } catch (e) {
      console.warn("Redis GET error", e);
    }

    if (!aiResponse) {
      // 2. Cache Miss - Call AI
      // Reset defaults
      aiResponse = {
        analysis: "AI Service Unavailable",
        score: 0,
        macros: { protein: "-", carbs: "-", fat: "-" },
        suggestions: ["Could not analyze meal."],
      };
      modelUsed = "fallback";

      const userContext = userProfile
        ? `User Profile: Age ${userProfile.age}, Gender ${userProfile.gender}, Goal ${userProfile.goal}`
        : "User Profile: General Adult";

      const missingData = totalCalories === 0;

      const prompt = `
        ${userContext}
        
        Meal Content:
        ${breakdown.join("\n")}
        
        Total Nutrition (Calculated from Metadata):
        Calories: ${totalCalories} kcal
        Protein: ${totalProtein} g
        Carbs: ${totalCarbs} g
        Fat: ${totalFat} g

        ${
          missingData
            ? "IMPORTANT: The metadata for these items is missing nutrition facts (showing 0). Please ESTIMATE the total calories and macros based on the standard serving size of these dishes. Provide your estimated totals in the analysis text, but you cannot change the numeric 'totals' response field, just explain it in the text."
            : ""
        }
        `;

      try {
        console.log("🤖 Calling OpenRouter AI for nutrition analysis...");

        let text = null;

        // Retry Logic with Multiple Models
        for (const model of MODELS) {
          try {
            console.log(`🤖 [NUTRITION] Calling Model: ${model}`);
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
              console.log(`✅ [NUTRITION] Success with ${model}`);
              modelUsed = model;
              break; // Success!
            }
          } catch (modelError) {
            console.warn(
              `⚠️ [NUTRITION] Model ${model} failed:`,
              modelError.message
            );
            // Continue to next model
          }
        }

        if (!text) throw new Error("All AI models failed");

        console.log("✅ AI Response received");

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiResponse = JSON.parse(jsonMatch[0]);
        } else {
          console.warn("⚠️ Could not parse JSON from AI response");
        }

        // 3. Set Cache (24 Hours)
        // Store wrapper object to keep model info
        await redis.set(cacheKey, { aiResponse, modelUsed }, { ex: 86400 });
      } catch (error) {
        console.error("AI Error:", error);
        // Fallback or handle error
        aiResponse = {
          analysis: "AI Service Temporarily Unavailable",
          score: 0,
          macros: { protein: "?", carbs: "?", fat: "?" },
          suggestions: ["Please try again later."],
        };
        modelUsed = "error-fallback";
      }
    }

    return NextResponse.json({
      success: true,
      totals: {
        calories:
          totalCalories || aiResponse?.estimated_nutrition?.calories || 0,
        protein: totalProtein || aiResponse?.estimated_nutrition?.protein || 0,
        carbs: totalCarbs || aiResponse?.estimated_nutrition?.carbs || 0,
        fat: totalFat || aiResponse?.estimated_nutrition?.fat || 0,
      },
      ai: aiResponse,
      model: modelUsed,
    });
  }, req);
