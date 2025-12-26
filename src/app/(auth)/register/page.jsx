"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { toast } from "react-toastify";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, setRole } = useAuthStore();

  // Animation Refs
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const mouthRef = useRef(null);
  const browLRef = useRef(null);
  const browRRef = useRef(null);
  const bodyRef = useRef(null);
  const headRef = useRef(null);
  const glassesRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    const eyeR = document.querySelector(".eyeR");
    const eyeL = document.querySelector(".eyeL");

    if (!eyeL || !eyeR) return;

    gsap.set(bodyRef.current, { y: 0 });

    const eyeFollow = (e) => {
      if (!formRef.current) return;
      const bounds = formRef.current.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const percent = x / bounds.width;
      gsap.to([eyeL, eyeR], {
        x: (percent - 0.5) * 10,
        duration: 0.2,
      });
    };

    const blink = () =>
      gsap.to([eyeL, eyeR], {
        scaleY: 0.1,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
      });

    const idleAnim = gsap.to(bodyRef.current, {
      y: -3,
      repeat: -1,
      yoyo: true,
      duration: 1.2,
      ease: "power1.inOut",
    });

    window.addEventListener("mousemove", eyeFollow);

    const blinkInterval = setInterval(() => {
      if (document.activeElement !== passwordRef.current) blink();
    }, Math.random() * 4000 + 2000);

    return () => {
      window.removeEventListener("mousemove", eyeFollow);
      clearInterval(blinkInterval);
      idleAnim.kill();
    };
  }, []);

  const onSimpleFocus = () => {
    const eyeR = document.querySelector(".eyeR");
    const eyeL = document.querySelector(".eyeL");
    gsap.to([eyeL, eyeR], { y: 10, duration: 0.2 });
  };

  const onPasswordFocus = () => {
    const eyeR = document.querySelector(".eyeR");
    const eyeL = document.querySelector(".eyeL");
    gsap.to([eyeL, eyeR], { scaleY: 0.1, y: 0, duration: 0.2 });
  };

  const onInputBlur = () => {
    const eyeR = document.querySelector(".eyeR");
    const eyeL = document.querySelector(".eyeL");
    gsap.to([eyeL, eyeR], { y: 0, scale: 1, duration: 0.2 });
  };

  const handleNameInput = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, name: value });

    // Smile Animation
    const smile =
      value.length > 2
        ? "M90,108 Q100,120 110,108" // Big Smile
        : "M90,110 Q100,115 110,110"; // Neutral/Small Smile

    gsap.to(mouthRef.current, { attr: { d: smile }, duration: 0.3 });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.register(formData.email, formData.password, formData.name);
      toast.success("Registration Successful! Please login.");
      
      // Wait for Firebase onAuthStateChanged to update Zustand store
      await new Promise(resolve => setTimeout(resolve, 300));
      
      router.push("/login?registered=true");
      router.refresh(); // Force re-render to pick up auth state
    } catch (error) {
      console.error("Registration Error:", error);
      let message = "An error occurred during registration";
      if (error.code === 'auth/email-already-in-use') {
        message = "This email is already in use. Please login instead.";
      } else if (error.code === 'auth/weak-password') {
        message = "Password must be at least 6 characters long.";
      } else if (error.code === 'auth/invalid-email') {
        message = "Please enter a valid email address.";
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const user = await authService.loginWithGoogle();
      
      // Get role
      const role = await authService.getUserRole(user.uid);
      
      // Update store
      setUser(user);
      setRole(role);
      
      toast.success("Welcome!");
      router.push(role === 'admin' ? '/admin' : '/');
    } catch (error) {
        console.error(error);
      toast.error("Google sign in failed");
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
        ref={formRef}
        className="relative z-10 w-full max-w-md p-8 bg-glass-bg border border-white/20 rounded-2xl shadow-2xl backdrop-blur-md"
      >
        <h2 className="text-3xl font-bold text-center text-primary-gold mb-2 font-sans">
          Create Account
        </h2>

        {/* Yeti Animation SVG */}
        <div className="w-full flex justify-center mb-6">
          <svg className="w-40 h-40 transition-transform duration-300" viewBox="0 0 200 230">
            <g ref={bodyRef}>
              <g ref={headRef} style={{ cursor: "pointer" }}>
                <circle cx="100" cy="100" r="80" fill="#db7575" stroke="#000" strokeWidth="3" />
                <g className="eyeL"><circle cx="85.5" cy="78.5" r="5" fill="#000" /></g>
                <g className="eyeR"><circle cx="114.5" cy="78.5" r="5" fill="#000" /></g>
                <g className="brows">
                  <rect ref={browLRef} x="75" y="65" width="10" height="3" rx="1.5" fill="#000" />
                  <rect ref={browRRef} x="115" y="65" width="10" height="3" rx="1.5" fill="#000" />
                </g>
                <g className="mouth">
                  <path ref={mouthRef} d="M90,110 Q100,115 110,110" fill="none" stroke="#000" strokeWidth="2" />
                </g>
                <g ref={glassesRef} style={{ opacity: 0 }}>
                  <rect x="67" y="70" width="30" height="16" rx="4" fill="#000" />
                  <rect x="103" y="70" width="30" height="16" rx="4" fill="#000" />
                  <line x1="97" y1="78" x2="103" y2="78" stroke="#E63946" strokeWidth="2" />
                </g>
              </g>
            </g>
          </svg>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Full Name</label>
            <input
              ref={nameRef}
              type="text"
              name="name"
              value={formData.name}
              onFocus={onSimpleFocus}
              onBlur={onInputBlur}
              onChange={handleNameInput}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-primary-gold text-white placeholder-gray-400 transition-colors"
              placeholder="John Doe"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Email</label>
            <input
              ref={emailRef}
              type="email"
              name="email"
              value={formData.email}
              onFocus={onSimpleFocus}
              onBlur={onInputBlur}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-primary-gold text-white placeholder-john@example.com"
              placeholder="john@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Password</label>
            <input
              ref={passwordRef}
              type="password"
              name="password"
              value={formData.password}
              onFocus={onPasswordFocus}
              onBlur={onInputBlur}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-primary-gold text-white placeholder-gray-400 transition-colors"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => gsap.fromTo(glassesRef.current, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 })}
            onMouseLeave={() => gsap.to(glassesRef.current, { y: -30, opacity: 0, duration: 0.4 })}
            className={`w-full py-3 bg-primary-red hover:bg-red-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-red-900/50 mt-4 flex justify-center items-center ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "Register"}
          </button>
        </form>

        <div className="mt-4 text-center text-gray-300">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-gold hover:underline">
            Login here
          </Link>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-black text-neutral-500 font-medium">
                Or
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 text-white py-2.5 rounded-full text-sm font-medium hover:bg-white/10 transition-all transform hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-lg backdrop-blur-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
