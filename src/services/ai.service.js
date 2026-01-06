import { auth } from "@/lib/firebase/client";

let recommendationPromise = null;
let nutritionPromise = null;
let descriptionPromise = null;
let searchPromise = null;

const getAuthHeaders = async () => {
  const token = await auth.currentUser?.getIdToken();
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export const aiService = {
  getRecommendations: async () => {
    if (recommendationPromise) return recommendationPromise; // so that multiple requests are not made becz of rate limit

    recommendationPromise = (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/ai/recommend", {
          method: "POST",
          headers,
          body: JSON.stringify({}),
        });
        return res.json();
      } finally {
        setTimeout(() => (recommendationPromise = null), 500); // so that new request can be made
      }
    })();

    return recommendationPromise;
  },

  getNutritionAnalysis: async (items, userProfile) => {
    if (nutritionPromise) return nutritionPromise;

    nutritionPromise = (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/ai/nutrition", {
          method: "POST",
          headers,
          body: JSON.stringify({ items, userProfile }),
        });
        return res.json();
      } finally {
        setTimeout(() => (nutritionPromise = null), 500);
      }
    })();

    return nutritionPromise;
  },

  generateDescription: async (name, category, isVeg) => {
    if (descriptionPromise) return descriptionPromise;

    descriptionPromise = (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/ai/generate-description", {
          method: "POST",
          headers,
          body: JSON.stringify({ name, category, isVeg }),
        });
        return res.json();
      } finally {
        setTimeout(() => (descriptionPromise = null), 500);
      }
    })();

    return descriptionPromise;
  },

  search: async (query) => {
    if (searchPromise) return searchPromise;

    searchPromise = (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/ai/search", {
          method: "POST",
          headers,
          body: JSON.stringify({ query }),
        });
        return res.json();
      } finally {
        setTimeout(() => (searchPromise = null), 500);
      }
    })();

    return searchPromise;
  },
};
