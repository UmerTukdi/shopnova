import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RazorpayScript from '@/components/RazorpayScript';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ShopNova — Shop Smarter. Shop Better.',
  description:
    'Discover premium electronics, smart gadgets, laptops, audio gear, and wearables at ShopNova. Instant checkout with secure Razorpay test payments and fast delivery.',
  keywords: ['ecommerce', 'tech gadgets', 'electronics', 'smartphones', 'headphones', 'smartwatches', 'ShopNova'],
  authors: [{ name: 'ShopNova Team' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${outfit.variable}`}>
      <body className="bg-[#F8FAFC] text-[#0F172A] min-h-screen flex flex-col antialiased selection:bg-indigo-600 selection:text-white">
        <AuthProvider>
          <CartProvider>
            <RazorpayScript />
            <Navbar />
            <main className="flex-1 w-full flex flex-col">
              {children}
            </main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
