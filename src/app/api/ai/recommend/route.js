import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

export const POST = (req) =>
  apiWrapper(async (request) => {
    // 1. Get User Context (if logged in)
    let userId = null;
    try {
      const auth = await verifyAuth(request);
      userId = auth.uid;
    } catch (e) {
      // Guest mode is fine
    }

    // 2. Fetch Candidates (e.g., top 30 active items to save tokens)
    // In real app: use vector DB or search index. Here: fetch recent/popular.
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
    }));

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        items: [],
        reason: "No menu items available",
      });
    }

    // 3. Fetch Past Orders (if user exists)
    let pastOrders = [];
    if (userId) {
      const ordersSnap = await adminDb
        .collection("orders")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      ordersSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.items) {
          data.items.forEach((item) => pastOrders.push(item.name));
        }
      });
    }

    // 4. Construct Prompt
    const hour = new Date().getHours();
    const timeOfDay = hour < 11 ? "Breakfast" : hour < 16 ? "Lunch" : "Dinner";
    const context = {
      time: timeOfDay,
      userHistory:
        [...new Set(pastOrders)].slice(0, 5).join(", ") || "New User",
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

    // 5. Call AI
    let recommendedIds = [];
    let reason = `Chef's Specials for ${timeOfDay}`;

    if (model) {
      try {
        const result = await model.generateContent([SYSTEM_PROMPT, prompt]);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          recommendedIds = parsed.recommendations || [];
          reason = parsed.reason || reason;
        }
      } catch (e) {
        console.error("Gemini Error", e);
        // Fallback: Pick random 3
        recommendedIds = candidates
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map((c) => c.id);
      }
    } else {
      // Mock
      recommendedIds = candidates
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((c) => c.id);
      reason = "Best Sellers (Demo Mode)";
    }

    // 6. Hydrate Results
    const recommendedItems = candidates
      .filter((c) => recommendedIds.includes(c.id))
      .map((c) => {
        // We need full details for the card.
        // Since we only fetched a subset of fields for candidates, we might need to grab full data
        // OR just map what we have if it's enough.
        // Let's assume we need image url etc.
        // Loop back to productsSnap to find the full data.
        const doc = productsSnap.docs.find((d) => d.id === c.id);
        return { id: c.id, ...doc.data() };
      });

    return NextResponse.json({
      success: true,
      items: recommendedItems,
      reason: reason,
    });
  }, req);
