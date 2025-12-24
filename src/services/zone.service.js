import axios from "axios";
import { auth } from "@/lib/firebase/client";

const API_URL = "/api/admin/zones";

const getAuthHeaders = async () => {
  const token = await auth.currentUser?.getIdToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const zoneService = {
  // Public endpoint - no auth required (for delivery validation)
  getPublicZones: async () => {
    const response = await axios.get("/api/zones");
    return response.data;
  },

  // Admin endpoints - require authentication
  getAllZones: async () => {
    const headers = await getAuthHeaders();
    const response = await axios.get(API_URL, headers);
    return response.data;
  },

  createZone: async (zoneData) => {
    const headers = await getAuthHeaders();
    const response = await axios.post(API_URL, zoneData, headers);
    return response.data;
  },

  updateZone: async (id, zoneData) => {
    const headers = await getAuthHeaders();
    const response = await axios.put(`${API_URL}/${id}`, zoneData, headers);
    return response.data;
  },

  deleteZone: async (id) => {
    const headers = await getAuthHeaders();
    const response = await axios.delete(`${API_URL}/${id}`, headers);
    return response.data;
  },
};
