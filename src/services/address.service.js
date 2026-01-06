import { auth } from "@/lib/firebase/client";

const API_URL = "/api/user/addresses";

const getAuthHeaders = async () => {
  const token = await auth.currentUser?.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const addressService = {
  getMyAddresses: async () => {
    const headers = await getAuthHeaders();
    const res = await fetch(API_URL, { headers });
    if (!res.ok) throw new Error("Failed to fetch addresses");
    return await res.json();
  },

  addAddress: async (addressData) => {
    const headers = await getAuthHeaders();
    const res = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(addressData),
    });
    if (!res.ok) throw new Error("Failed to add address");
    return await res.json();
  },

  updateAddress: async (id, addressData) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(addressData),
    });
    if (!res.ok) throw new Error("Failed to update address");
    return await res.json();
  },

  deleteAddress: async (id) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) throw new Error("Failed to delete address");
    return await res.json();
  },
};
