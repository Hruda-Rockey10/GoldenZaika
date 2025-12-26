import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { redis } from "@/lib/redis/upstash"; // Import Redis
import crypto from "crypto";

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
  "suggestions": ["Tip 1", "Tip 2"]
}
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
      const cals = (item.calories || 0) * qty;
      const prot = (item.protein || 0) * qty;
      const carbs = (item.carbs || 0) * qty;
      const fat = (item.fat || 0) * qty;

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

    // 1. Check Redis
    try {
      aiResponse = await redis.get(cacheKey);
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

      const userContext = userProfile
        ? `User Profile: Age ${userProfile.age}, Gender ${userProfile.gender}, Goal ${userProfile.goal}`
        : "User Profile: General Adult";

      const prompt = `
        ${userContext}
        
        Meal Content:
        ${breakdown.join("\n")}
        
        Total Nutrition:
        Calories: ${totalCalories} kcal
        Protein: ${totalProtein} g
        Carbs: ${totalCarbs} g
        Fat: ${totalFat} g
        `;

      if (model) {
        try {
          console.log("🤖 Calling Gemini API for nutrition analysis...");

          const result = await model.generateContent([SYSTEM_PROMPT, prompt]);

          const response = await result.response;
          const text = response.text();

          console.log("✅ Gemini Response received");

          // Extract JSON from response
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiResponse = JSON.parse(jsonMatch[0]);
          } else {
            console.warn("⚠️ Could not parse JSON from Gemini response");
          }

          // 3. Set Cache (24 Hours)
          await redis.set(cacheKey, aiResponse, { ex: 86400 });
        } catch (error) {
          console.error("Gemini Error:", error);
        }
      } else {
        // Mock Response for dev if no key
        aiResponse = {
          analysis: "API Key Missing - Demo Mode",
          score: 5,
          macros: { protein: "Unknown", carbs: "Unknown", fat: "Unknown" },
          suggestions: ["Add GEMINI_API_KEY to .env to see real AI analysis."],
        };
      }
    }

    return NextResponse.json({
      success: true,
      totals: {
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
      },
      ai: aiResponse,
    });
  }, req);
