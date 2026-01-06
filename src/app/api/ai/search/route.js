import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { apiWrapper } from "@/utils/api-wrapper";
import OpenAI from "openai";
import { redis } from "@/lib/redis/upstash"; // Import Redis

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
You are a Search query parser for a food delivery app.
Convert the user's natural language search into structured filters for a database query.

Available Categories: Pizza, Burger, Sandwich, Rolls, Biryani, Sweets, Drinks, Ice Cream, Butter Chicken, Salad, Samosa.
Fields to Extract:
- category: One of the above (exact match), or null.
- maxPrice: Number or null.
- minPrice: Number or null.
- isVeg: true/false/null.
- keywords: Array of strings (e.g., "spicy", "chicken", "paneer") to filter by name/description.

Input: "spicy veg food under 200"
Output JSON:
{
  "category": null,
  "maxPrice": 200,
  "minPrice": null,
  "isVeg": true,
  "keywords": ["spicy"]
}

Input: "chicken biryani"
Output JSON:
{
  "category": "Biryani",
  "keywords": ["chicken"],
  "isVeg": false
}
`;

export const POST = (req) =>
  apiWrapper(async (request) => {
    const { query } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ success: true, items: [] });
    }

    const cacheKey = `ai:search:${query.toLowerCase().trim()}`;
    let filters = null;
    let modelUsed = "redis-cache";

    // 1. Try Cache
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log("🟢 [SEARCH] Serving from Redis Cache");
        filters = cachedData.filters;
        modelUsed = cachedData.modelUsed || "redis-cache";
      }
    } catch (e) {
      console.warn("Redis GET error", e);
    }

    if (!filters) {
      // 2. Cache Miss - Call OpenAI
      filters = { keywords: [query] }; // Default fallback
      modelUsed = "fallback";

      try {
        let text = null;

        // Retry Logic with Multiple Models
        for (const model of MODELS) {
          try {
            console.log(`🤖 [SEARCH] Calling Model: ${model}`);
            const completion = await openai.chat.completions.create({
              model: model,
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: query },
              ],
              response_format: { type: "json_object" },
            });

            text = completion.choices[0].message.content;
            if (text) {
              console.log(`✅ [SEARCH] Success with ${model}`);
              modelUsed = model;
              break; // Success!
            }
          } catch (modelError) {
            console.warn(
              `⚠️ [SEARCH] Model ${model} failed:`,
              modelError.message
            );
            // Continue to next model
          }
        }

        if (!text) throw new Error("All AI models failed");

        // text is populated above

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          filters = JSON.parse(jsonMatch[0]);
        }

        // 3. Set Cache (1 Hour)
        await redis.set(cacheKey, { filters, modelUsed }, { ex: 3600 });
      } catch (e) {
        console.error("AI Generation Error", e);
        modelUsed = "error-fallback";
      }
    }

    // Build Firestore Query
    let dbQuery = adminDb
      .collection("products")
      .where("isAvailable", "==", true);

    if (filters.category) {
      dbQuery = dbQuery.where("category", "==", filters.category);
    }

    // Firestore limitation: inequality filters must be on the same field
    // We'll handle price filtering in memory if possible, or limit basic query first.
    // Let's fetch basic set then filter.
    // If isVeg is specified
    if (filters.isVeg !== null && filters.isVeg !== undefined) {
      dbQuery = dbQuery.where("isVeg", "==", filters.isVeg);
    }

    const snapshot = await dbQuery.get();
    let items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Memory Filtering for Price & Keywords (Fuzzy search)
    items = items.filter((item) => {
      // Price
      if (filters.maxPrice && item.price > filters.maxPrice) return false;
      if (filters.minPrice && item.price < filters.minPrice) return false;

      // Keywords (Name/Desc match)
      if (filters.keywords && filters.keywords.length > 0) {
        const text = (item.name + " " + (item.description || "")).toLowerCase();
        // Check if ANY keyword matches (OR logic) or ALL (AND logic)?
        // Better UX: ALL roughly.
        const hasMatch = filters.keywords.some((kw) =>
          text.includes(kw.toLowerCase())
        );
        // Special case: if category was extracted, we assume relevance.
        // If just keywords, filter.
        if (!filters.category && !hasMatch) return false;
        // If category matched, we trust DB query, but "spicy" keyword might filter further.
        if (filters.category && filters.keywords.length > 0) {
          // specific keyword filter
          return hasMatch;
        }
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      items: items,
      filtersUsed: filters,
      model: modelUsed,
    });
  }, req);
