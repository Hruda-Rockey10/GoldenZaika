"use client";

import AdminSidebar from "@/components/admin/Sidebar";
import Image from "next/image";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client"; // Check actual auth state
import { onAuthStateChanged } from "firebase/auth";
import { authService } from "@/services/auth.service";

export default function AdminLayout({ children }) {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      // Check role
      const role = await authService.getUserRole(currentUser.uid);
      if (role !== "admin") {
        router.replace("/");
      } else {
        setIsAdmin(true);
      }
      setCheckingRole(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (checkingRole) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-gold"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-black flex font-sans text-white relative">
      <div className="fixed inset-0 z-0">
        <Image
          src="/assets/food-types/biryani.jpg"
          alt="Background"
          fill
          className="object-cover opacity-20"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 flex w-full">
        <AdminSidebar />
        <div className="flex-1 ml-64 p-8 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
