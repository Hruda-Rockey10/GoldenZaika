"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  authService
} from "@/services/auth.service";
import { Mail, Trash2, Calendar, Search, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Messages
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await authService.getMessages();
      // API returns { success, data }
      const data = response.data || [];
      setMessages(data);
      setFilteredMessages(data);
    } catch (error) {
      toast.error("Error fetching messages");
      setMessages([]);
      setFilteredMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Search Logic
  useEffect(() => {
    const results = messages.filter(
      (msg) =>
        msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMessages(results);
  }, [searchTerm, messages]);

  // Delete Message
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      await authService.deleteMessage(id);
      toast.success("Message deleted");
      // Remove from local state
      const updatedMessages = messages.filter((msg) => msg._id !== id);
      setMessages(updatedMessages);
      setFilteredMessages(
        updatedMessages.filter(
          (msg) =>
            msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  // Toggle Status
  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "unread" ? "read" : "unread";
    try {
      await authService.updateMessageStatus(id, newStatus);
      toast.success(`Marked as ${newStatus}`);

      // Update local state
      const updateState = (prev) =>
        prev.map((msg) =>
          msg._id === id ? { ...msg, status: newStatus } : msg
        );
      setMessages(updateState);
      setFilteredMessages((prev) =>
        prev.map((msg) =>
          msg._id === id ? { ...msg, status: newStatus } : msg
        )
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  // Format Date - Robust Firestore Timestamp Handler
  const formatDate = (dateInput) => {
    if (!dateInput) return "N/A";
    
    try {
      let date;
      
      // Handle Firestore Timestamp
      if (dateInput.seconds) {
        date = new Date(dateInput.seconds * 1000);
      } else if (dateInput._seconds) {
        date = new Date(dateInput._seconds * 1000);
      } else {
        date = new Date(dateInput);
      }

      // Validate
      if (isNaN(date.getTime())) return "Invalid Date";

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "N/A";
    }
  };

  return (
    <div className="min-h-screen text-white">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <span className="bg-primary-gold text-black rounded-lg p-2">
              <Mail size={32} />
            </span>
            User Messages
          </h1>
          <p className="text-gray-400 mt-1 ml-1">
            Manage inquiries from your customers
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-gold transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary-gold focus:bg-white/10 transition-all placeholder-gray-600"
            />
          </div>
          <button
            onClick={fetchMessages}
            className="p-3 bg-white/5 hover:bg-primary-gold hover:text-black rounded-xl border border-white/10 transition-all"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading && messages.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-white/5 animate-pulse rounded-2xl"
            ></div>
          ))}
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/10 border-dashed">
          <Mail size={64} className="mx-auto text-gray-600 mb-6" />
          <h3 className="text-2xl font-bold text-gray-400 mb-2">
            No messages found
          </h3>
          <p className="text-gray-500">
            {searchTerm ? "Try a different search term" : "Your inbox is empty"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredMessages.map((msg, index) => {
              const id = msg._id || msg.id;
              return (
              <motion.div
                key={id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
                className={`backdrop-blur-md border rounded-2xl overflow-hidden hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] group flex flex-col h-full transition-all ${
                  msg.status === "unread"
                    ? "bg-white/10 border-white/20"
                    : "bg-white/5 border-white/5 opacity-70 hover:opacity-100"
                }`}
              >
                {/* Card Header */}
                <div className="p-5 border-b border-white/5 bg-black/20 flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-black font-bold text-lg shadow-lg ${
                        msg.status === "unread"
                          ? "bg-gradient-to-br from-primary-gold to-yellow-700"
                          : "bg-gray-600 text-gray-300"
                      }`}
                    >
                      {msg.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3
                        className={`font-bold text-lg leading-tight transition-colors ${
                          msg.status === "unread"
                            ? "text-white group-hover:text-primary-gold"
                            : "text-gray-400"
                        }`}
                      >
                        {msg.name}
                      </h3>
                      <a
                        href={`mailto:${msg.email}`}
                        className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                      >
                        {msg.email}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleStatus(id, msg.status)}
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border transition-all cursor-pointer ${
                      msg.status === "unread"
                        ? "bg-primary-gold text-black border-primary-gold hover:bg-yellow-400"
                        : "bg-white/5 text-gray-500 border-white/5 hover:border-gray-500 hover:text-white"
                    }`}
                    title="Click to toggle status"
                  >
                    {msg.status || "Unread"}
                  </button>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.message}
                </div>

                {/* Card Footer */}
                <div className="p-4 bg-black/20 border-t border-white/5 flex justify-between items-center group-hover:bg-black/30 transition-colors">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={14} />
                    {formatDate(msg.createdAt)}
                  </div>
                  <button
                    onClick={() => handleDelete(id)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete Message"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            )})}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
