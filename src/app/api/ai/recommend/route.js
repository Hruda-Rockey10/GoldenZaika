import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import OpenAI from "openai";
import { redis } from "@/lib/redis/upstash";

// --- Configuration ---
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Golden Zaika",
  },
});

const MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "mistralai/devstral-2512:free",
  "openai/gpt-oss-120b:free",
  "xiaomi/mimo-v2-flash:free",
];

const SYSTEM_PROMPT = `
You are a Smart Food Recommender. 
Pick the best 3 items from the "Candidate Menu" for the user based on:
1. Current Time (Breakfast/Lunch/Dinner)
2. User's Past Orders (Taste profile)
3. Weather/Vibe (Implied)

Output JSON:
{
  "recommendations": ["id1", "id2", "id3"],
  "reason": "Short catchy reason, e.g., 'Perfect for a rainy evening' or 'Since you love spicy food'"
}
`;

// --- Helpers ---

async function getUserId(request) {
  try {
    const auth = await verifyAuth(request);
    return auth.uid;
  } catch {
    return null; // Guest mode
  }
}

async function getCandidates() {
  // Fetch top 30 active items to save tokens
  const productsSnap = await adminDb
    .collection("products")
    .where("isAvailable", "==", true)
    .limit(30)
    .get();

  const candidates = productsSnap.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    category: doc.data().category,
    price: doc.data().price,
    tags: [doc.data().isVeg ? "Veg" : "Non-Veg", doc.data().category].join(
      ", "
    ),
    // Keep full data for hydration later
    fullData: doc.data(),
  }));

  return { candidates, productsSnap };
}

async function getPastOrders(userId) {
  if (!userId) return [];

  const ordersSnap = await adminDb
    .collection("orders")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(5)
    .get();

  const orders = [];
  ordersSnap.docs.forEach((doc) => {
    const data = doc.data();
    if (data.items) {
      data.items.forEach((item) => orders.push(item.name));
    }
  });
  return [...new Set(orders)].slice(0, 5); // Unique last 5 items
}

async function callAIModel(prompt) {
  for (const model of MODELS) {
    try {
      console.log(`🤖 [RECOMMEND] Calling Model: ${model}`);
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const text = completion.choices[0].message.content;
      if (text) {
        console.log(`✅ [RECOMMEND] Success with ${model}`);
        return { text, modelUsed: model };
      }
    } catch (modelError) {
      console.warn(`⚠️ [RECOMMEND] Model ${model} failed:`, modelError.message);
    }
  }
  throw new Error("All AI models failed");
}

function getFallbackRecommendations(candidates) {
  const ids = candidates
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map((c) => c.id);

  return {
    recommendations: ids,
    reason: "Chef's Selection (Offline Mode)",
    modelUsed: "offline-fallback",
  };
}

// --- Main Handler ---

export const POST = (req) =>
  apiWrapper(async (request) => {
    const userId = await getUserId(request);
    const { candidates } = await getCandidates();

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        items: [],
        reason: "No menu items available",
      });
    }

    const hour = new Date().getHours();
    const timeOfDay = hour < 11 ? "Breakfast" : hour < 16 ? "Lunch" : "Dinner";
    const cacheKey = `ai:recommend:${userId || "guest"}:${timeOfDay}`;

    // 1. Check Cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log("🟢 [RECOMMEND] Serving from Redis Cache");
        // Hydrate
        const items = candidates
          .filter((c) => cached.recommendations.includes(c.id))
          .map((c) => ({ id: c.id, ...c.fullData }));

        return NextResponse.json({
          success: true,
          items,
          reason: cached.reason,
          model: cached.modelUsed || "redis-cache",
        });
      }
    } catch (e) {
      console.warn("Redis checking error", e);
    }

    console.log("🟡 [RECOMMEND] Cache Miss - Initiating AI...");

    // 2. Prepare Context
    const pastOrders = await getPastOrders(userId);
    const context = {
      time: timeOfDay,
      userHistory: pastOrders.join(", ") || "New User",
      candidates: candidates
        .map((c) => `${c.id}: ${c.name} (${c.tags})`)
        .join("\n"),
    };

    const prompt = `
    Context:
    Time: ${context.time}
    User History: ${context.userHistory}

    Candidate Menu:
    ${context.candidates}
    `;

    // 3. Call AI
    let aiParams = {};
    try {
      const { text, modelUsed } = await callAIModel(prompt);
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0]);

      if (parsed) {
        aiParams = { ...parsed, modelUsed };
      } else {
        throw new Error("Invalid format");
      }
    } catch (e) {
      console.error("❌ [RECOMMEND] AI Generation Fatal Error", e);
      aiParams = getFallbackRecommendations(candidates);
    }

    // 4. Cache & Return
    try {
      await redis.set(
        cacheKey,
        {
          recommendations: aiParams.recommendations || [],
          reason: aiParams.reason,
          modelUsed: aiParams.modelUsed,
        },
        { ex: 300 }
      );
    } catch (e) {
      console.warn("Redis write error", e);
    }

    const items = candidates
      .filter((c) => (aiParams.recommendations || []).includes(c.id))
      .map((c) => ({ id: c.id, ...c.fullData }));

    return NextResponse.json({
      success: true,
      items,
      reason: aiParams.reason || "Recommended for you",
      model: aiParams.modelUsed,
    });
  }, req);
