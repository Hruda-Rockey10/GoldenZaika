"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { toast } from "react-toastify";
import { authService } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Animation Refs
  const emailRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Simple entrance animation
    gsap.fromTo(containerRef.current, 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.sendPasswordResetEmail(email);
      toast.success("Password reset email sent! Check your inbox.");
      setEmail(""); // Clear input on success
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        toast.error("No account found with this email.");
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black font-sans">
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

      <div
        ref={containerRef}
        className="relative z-10 w-full max-w-md p-8 bg-glass-bg border border-white/20 rounded-2xl shadow-2xl backdrop-blur-md"
      >
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-primary-gold mb-2 font-sans">
            Forgot Password
          </h2>
          <p className="text-gray-300 text-sm">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Email</label>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-primary-gold text-white placeholder-gray-400 transition-colors"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-primary-red hover:bg-red-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-red-900/50 flex justify-center items-center ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-300">
          Remember your password?{" "}
          <Link href="/login" className="text-primary-gold hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
