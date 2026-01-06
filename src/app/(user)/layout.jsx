import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

export default function UserLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen relative">
      {/* flex flex-col
      Vertical Stacking: It turns this div into a column. */}
      {/* min-h-screen */}
      {/* Minimum Height = 100vh: It forces this container to be at least as tall as your browser window. */}
      
      <Navbar />
      <main className="flex-grow pt-20">
        {/* flex-grow: This is the magic. */}
        {/* It tells the middle content: "Expand to fill all available empty space." */}
        {children}
      </main>
      <Footer />
    </div>
  );
}

                // <RootLayout>                {/* app/layout.jsx */}
                //   <AuthProvider>
                //       <UserLayout>          {/* app/(user)/layout.jsx */}
                //         <HomePage />       {/* app/(user)/page.jsx */}
                //       </UserLayout>
                //   </AuthProvider>
                // </RootLayout>