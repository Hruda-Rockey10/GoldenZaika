import './globals.css';
import { Inter, Poppins } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const poppins = Poppins({ 
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export const metadata = {
  title: 'GoldenZaika',
  description: 'Premium Food Delivery App',
};

import AuthProvider from '../components/common/AuthProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${poppins.variable} font-sans`} suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <ToastContainer position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
