import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

export default function UserLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen relative">
      <Navbar />
      <main className="flex-grow pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}
