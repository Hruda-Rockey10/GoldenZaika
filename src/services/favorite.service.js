import axios from "axios";
import { auth } from "@/lib/firebase/client";

const API_URL = "/api/user/favorites";

const getAuthHeaders = async () => {
  const token = await auth.currentUser?.getIdToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const favoriteService = {
  getMyFavorites: async () => {
    const headers = await getAuthHeaders();
    const response = await axios.get(API_URL, headers);
    return response.data;
  },

  addFavorite: async (productId) => {
    const headers = await getAuthHeaders();
    const response = await axios.post(API_URL, { productId }, headers);
    return response.data;
  },

  removeFavorite: async (productId) => {
    const headers = await getAuthHeaders();
    // Use params or body? Delete with body is tricky in some clients/proxies.
    // Better to use URL param: /api/user/favorites/[productId]
    const response = await axios.delete(`${API_URL}/${productId}`, headers);
    return response.data;
  },

  toggleFavorite: async (productId, isFavorite) => {
    if (isFavorite) {
      return await favoriteService.removeFavorite(productId);
    } else {
      return await favoriteService.addFavorite(productId);
    }
  },
};
