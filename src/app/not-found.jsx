import Link from 'next/link';
import { Home, UtensilsCrossed } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-primary-gold/10 p-6 rounded-full mb-8 backdrop-blur-sm border border-primary-gold/20">
        <UtensilsCrossed size={64} className="text-primary-gold" />
      </div>
      
      <h1 className="text-8xl font-bold text-primary-gold mb-2 tracking-tighter">404</h1>
      <h2 className="text-3xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-gray-400 max-w-md mb-8 text-lg">
        Looks like you've ventured into an empty kitchen. The page you're looking for acts like it never existed.
      </p>
      
      <Link 
        href="/"
        className="flex items-center gap-2 bg-primary-gold hover:bg-yellow-500 text-black px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-primary-gold/20"
      >
        <Home size={22} />
        Return Home
      </Link>
    </div>
  );
}
