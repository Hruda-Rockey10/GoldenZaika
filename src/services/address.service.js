import axios from "axios";
import { auth } from "@/lib/firebase/client";

const API_URL = "/api/user/addresses";

const getAuthHeaders = async () => {
  const token = await auth.currentUser?.getIdToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const addressService = {
  getMyAddresses: async () => {
    const headers = await getAuthHeaders();
    const response = await axios.get(API_URL, headers);
    return response.data;
  },

  addAddress: async (addressData) => {
    const headers = await getAuthHeaders();
    const response = await axios.post(API_URL, addressData, headers);
    return response.data;
  },

  updateAddress: async (id, addressData) => {
    const headers = await getAuthHeaders();
    const response = await axios.put(`${API_URL}/${id}`, addressData, headers);
    return response.data;
  },

  deleteAddress: async (id) => {
    const headers = await getAuthHeaders();
    const response = await axios.delete(`${API_URL}/${id}`, headers);
    return response.data;
  },
};
