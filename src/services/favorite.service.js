import { auth } from "@/lib/firebase/client";

const getAuthHeaders = async () => {
  const token = await auth.currentUser?.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const favoriteService = {
  getMyFavorites: async () => {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/user/favorites", { headers });
    if (!res.ok) throw new Error("Failed to fetch favorites");
    return await res.json();
  },

  addFavorite: async (productId) => {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/user/favorites", {
      method: "POST",
      headers,
      body: JSON.stringify({ productId }),
    });
    if (!res.ok) throw new Error("Failed to add favorite");
    return await res.json();
  },

  removeFavorite: async (productId) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/user/favorites/${productId}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) throw new Error("Failed to remove favorite");
    return await res.json();
  },

  toggleFavorite: async (productId, isFavorite) => {
    if (isFavorite) {
      return await favoriteService.removeFavorite(productId);
    } else {
      return await favoriteService.addFavorite(productId);
    }
  },
};
