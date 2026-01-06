import { auth } from "@/lib/firebase/client";

const API_URL = "/api/admin/zones";

const getAuthHeaders = async () => {
  const token = await auth.currentUser?.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const zoneService = {
  // Public endpoint - no auth required (for delivery validation)
  getPublicZones: async () => {
    const res = await fetch("/api/zones");
    if (!res.ok) throw new Error("Failed to fetch zones");
    return await res.json();
  },

  // Admin endpoints - require authentication
  getAllZones: async () => {
    const headers = await getAuthHeaders();
    const res = await fetch(API_URL, { headers });
    if (!res.ok) throw new Error("Failed to fetch admin zones");
    return await res.json();
  },

  createZone: async (zoneData) => {
    const headers = await getAuthHeaders();
    const res = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(zoneData),
    });
    if (!res.ok) throw new Error("Failed to create zone");
    return await res.json();
  },

  updateZone: async (id, zoneData) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(zoneData),
    });
    if (!res.ok) throw new Error("Failed to update zone");
    return await res.json();
  },

  deleteZone: async (id) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) throw new Error("Failed to delete zone");
    return await res.json();
  },
};
