"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { toast } from "react-toastify";
import { authService } from "@/services/auth.service"; // Updated Import

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Animation Refs
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

  const onEmailFocus = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.login(email, password);
      toast.success("Login Successful!");
      
      // Wait a bit for Firebase onAuthStateChanged to fire and update Zustand store
      await new Promise(resolve => setTimeout(resolve, 300));
      
      router.push("/");
      router.refresh(); // Force re-render to pick up new auth state
    } catch (err) {
      console.error(err);
      toast.error("Invalid email or password");
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
          Welcome Back
        </h2>

        {/* Yeti Animation SVG */}
        <div className="w-full flex justify-center mb-6">
          <svg
            className="w-40 h-40 transition-transform duration-300"
            viewBox="0 0 200 230"
          >
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Email</label>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onFocus={onEmailFocus}
              onBlur={onInputBlur}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-primary-gold text-white placeholder-gray-400 transition-colors"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Password</label>
            <input
              ref={passwordRef}
              type="password"
              value={password}
              onFocus={onPasswordFocus}
              onBlur={onInputBlur}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-primary-gold text-white placeholder-gray-400 transition-colors"
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => gsap.fromTo(glassesRef.current, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 })}
            onMouseLeave={() => gsap.to(glassesRef.current, { y: -30, opacity: 0, duration: 0.4 })}
            className={`w-full py-3 bg-primary-red hover:bg-red-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-red-900/50 flex justify-center items-center ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-300">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary-gold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
