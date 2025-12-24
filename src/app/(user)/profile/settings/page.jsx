"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth.store";
import { ArrowLeft, Save, User, Mail, Phone, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import Image from "next/image";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuthStore();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    displayName: "",
    phoneNumber: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        setFormData({
          displayName: user.displayName || "",
          phoneNumber: user.phoneNumber || "",
        });
      }
    }
  }, [user, authLoading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.displayName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }

    try {
      setSaving(true);
      
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, {
          displayName: formData.displayName,
        });

        toast.success("Profile updated successfully!");
        window.location.reload();
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-black font-sans">
      {/* Background Image with Blur */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/assets/food-types/biryani.jpg"
          alt="Background"
          fill
          className="object-cover opacity-60"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 pt-24 pb-12 px-4 md:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/profile"
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="text-white" size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Account <span className="text-primary-gold">Settings</span>
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Manage your profile information
              </p>
            </div>
          </div>

          {/* Settings Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-primary-gold flex items-center justify-center text-black text-3xl font-bold">
                  {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Profile Photo</h3>
                  <p className="text-gray-400 text-sm">
                    Using default avatar based on your initials
                  </p>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <label className="flex items-center gap-2 text-white font-semibold mb-3">
                <User size={20} className="text-primary-gold" />
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-gold transition-colors"
                required
              />
            </div>

            {/* Email (Read-only) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <label className="flex items-center gap-2 text-white font-semibold mb-3">
                <Mail size={20} className="text-primary-gold" />
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed"
              />
              <p className="text-gray-500 text-xs mt-2">
                Email cannot be changed. Managed by Firebase Authentication.
              </p>
            </div>

            {/* Phone Number (Optional) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <label className="flex items-center gap-2 text-white font-semibold mb-3">
                <Phone size={20} className="text-primary-gold" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Enter your phone number (optional)"
                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-gold transition-colors"
              />
              <p className="text-gray-500 text-xs mt-2">
                Note: Phone number updates require additional verification.
              </p>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-primary-gold hover:bg-yellow-500 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Changes
                </>
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-blue-400 text-sm">
              <strong>Note:</strong> For security reasons, password changes and email updates 
              must be done through Firebase Authentication. Contact support if you need assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
