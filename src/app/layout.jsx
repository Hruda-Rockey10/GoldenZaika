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
  icons: {
    icon: '/favicon.png', // Uses public/favicon.png
  },
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

// It sees src/app/(user).
// It treats the contents of (user) as if they were right in the root.
// It finds src/app/(user)/page.jsx.
// Result: This file becomes your Homepage (/).

/*
 * Component Hierarchy Visualized:
 *
 * <GlobalError>                 // src/app/global-error.jsx (Handles RootLayout crashes)
 *   <RootLayout>                // src/app/layout.jsx
 *     <AuthProvider>            // src/components/common/AuthProvider.jsx
 *       <ErrorBoundary>         // src/app/error.jsx (Wrapper for page errors)
 *         <UserLayout>          // src/app/(user)/layout.jsx
 *           <HomePage />        // src/app/(user)/page.jsx
 *         </UserLayout>
 *       </ErrorBoundary>
 *     </AuthProvider>
 *   </RootLayout>
 * </GlobalError>
 */