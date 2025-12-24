import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { apiWrapper } from "@/utils/api-wrapper";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { redis } from "@/lib/redis/upstash"; // Import Redis

// Initialize Gemini
let genAI;
let model;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
  }
} catch (e) {
  console.error("Gemini Init Error", e);
}

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

    // 1. Try Cache
    try {
      filters = await redis.get(cacheKey);
    } catch (e) {
      console.warn("Redis GET error", e);
    }

    if (!filters) {
      // 2. Cache Miss - Call OpenAI
      filters = { keywords: [query] }; // Default fallback

      if (model) {
        try {
          const result = await model.generateContent([SYSTEM_PROMPT, query]);
          const response = await result.response;
          const text = response.text();

          // Extract JSON from response
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            filters = JSON.parse(jsonMatch[0]);
          }

          // 3. Set Cache (1 Hour)
          await redis.set(cacheKey, filters, { ex: 3600 });
        } catch (e) {
          console.error("Gemini Error", e);
        }
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
    });
  }, req);
