import Link from 'next/link';
import Image from 'next/image';
import { connectDB } from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import ProductCard from '@/components/ProductCard';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Truck,
  ShieldCheck,
  RefreshCw,
  Award,
  ChevronRight,
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Layers,
} from 'lucide-react';

async function getHomeData() {
  try {
    await connectDB();
    const categories = await Category.find({}).lean();
    let featuredProducts = await Product.find({ featured: true, isDeleted: { $ne: true } })
      .limit(8)
      .lean();

    if (featuredProducts.length === 0) {
      featuredProducts = await Product.find({ isDeleted: { $ne: true } })
        .limit(8)
        .lean();
    }

    return {
      categories: JSON.parse(JSON.stringify(categories)),
      featuredProducts: JSON.parse(JSON.stringify(featuredProducts)),
    };
  } catch (error) {
    console.error('Error loading home data:', error);
    return { categories: [], featuredProducts: [] };
  }
}

export default async function HomePage() {
  const { categories, featuredProducts } = await getHomeData();

  const curatedCategories = [
    {
      name: 'Smartphones',
      slug: 'electronics',
      icon: Smartphone,
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80&auto=format&fit=crop',
      count: 'Flagships & 5G',
    },
    {
      name: 'Laptops',
      slug: 'electronics',
      icon: Laptop,
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80&auto=format&fit=crop',
      count: 'Ultrabooks & Pro',
    },
    {
      name: 'Audio',
      slug: 'electronics',
      icon: Headphones,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80&auto=format&fit=crop',
      count: 'ANC & Earbuds',
    },
    {
      name: 'Wearables',
      slug: 'electronics',
      icon: Watch,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80&auto=format&fit=crop',
      count: 'Smart Watches',
    },
    {
      name: 'Accessories',
      slug: 'fashion',
      icon: Layers,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80&auto=format&fit=crop',
      count: 'Gear & Bags',
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO: Sprylo Multi-Color Bento Grid */}
      <section className="pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Main Primary Hero Bento Card (Lg - 8 cols on desktop) */}
            <article className="lg:col-span-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E2A78] via-[#2B3FB7] to-[#3730A3] text-white p-6 sm:p-10 lg:p-12 shadow-xl flex flex-col justify-between min-h-[380px] sm:min-h-[440px]">
              {/* Radial ambient glow */}
              <div className="bento-sparkle" />
              <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-100 text-xs font-bold uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 text-amber-300" /> Featured Tech Launch
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                  Shop Smarter.<br />
                  <span className="text-indigo-200">Shop Better.</span>
                </h1>

                <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed max-w-md">
                  Premium technology, smart gear, noise-canceling acoustics, and everyday electronics. Seamless checkout with instant Razorpay test payments.
                </p>

                <div className="pt-2 flex items-center gap-4">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-sm shadow-lg hover:shadow-xl transition-all transform active:scale-95"
                  >
                    Shop Now <ArrowRight className="w-4 h-4 text-indigo-600" />
                  </Link>

                  <Link
                    href="/products?featured=true"
                    className="hidden sm:inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-colors"
                  >
                    View Deals
                  </Link>
                </div>
              </div>

              {/* Decorative Hero Product Artwork */}
              <div className="hidden sm:block absolute -right-6 -bottom-6 w-72 lg:w-96 aspect-square pointer-events-none opacity-90 lg:opacity-100">
                <Image
                  src="https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80&auto=format&fit=crop"
                  alt="ShopNova Tech Hub"
                  fill
                  priority
                  className="object-contain drop-shadow-2xl"
                />
              </div>

              {/* Dots indicator */}
              <div className="relative z-10 flex items-center gap-2 pt-6">
                <span className="w-8 h-2 rounded-full bg-white transition-all" />
                <span className="w-2 h-2 rounded-full bg-white/40" />
                <span className="w-2 h-2 rounded-full bg-white/40" />
              </div>
            </article>

            {/* Right Column Bento Cards (4 cols on desktop) */}
            <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
              {/* Supporting Card 1: Wearables (Purple Bento) */}
              <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white p-6 shadow-md flex items-center justify-between min-h-[190px] group">
                <div className="bento-sparkle" />
                <div className="relative z-10 space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-200">
                    Wearables
                  </span>
                  <h3 className="text-xl font-bold leading-tight">
                    Smart Watches<br />&amp; Fitness
                  </h3>
                  <Link
                    href="/products?category=electronics"
                    className="inline-flex items-center gap-1 text-xs font-bold text-white hover:text-purple-200 transition-colors pt-1"
                  >
                    Shop Now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="relative w-28 h-28 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80&auto=format&fit=crop"
                    alt="Smartwatch"
                    fill
                    className="object-contain"
                  />
                </div>
              </article>

              {/* Supporting Card 2: Smartphones (Teal Bento) */}
              <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F766E] to-[#115E59] text-white p-6 shadow-md flex items-center justify-between min-h-[190px] group">
                <div className="bento-sparkle" />
                <div className="relative z-10 space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-200">
                    Smartphones
                  </span>
                  <h3 className="text-xl font-bold leading-tight">
                    Next-Gen<br />5G Flagships
                  </h3>
                  <Link
                    href="/products?category=electronics"
                    className="inline-flex items-center gap-1 text-xs font-bold text-white hover:text-teal-200 transition-colors pt-1"
                  >
                    Shop Now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="relative w-28 h-28 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80&auto=format&fit=crop"
                    alt="Smartphone"
                    fill
                    className="object-contain"
                  />
                </div>
              </article>
            </div>

            {/* Bottom Row Bento Cards (3 even cards) */}
            <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Supporting Card 3: Laptops (Orange Bento) */}
              <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] text-white p-6 shadow-md flex items-center justify-between min-h-[160px] group">
                <div className="bento-sparkle" />
                <div className="relative z-10 space-y-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-200">
                    Laptops
                  </span>
                  <h3 className="text-lg font-bold leading-tight">
                    Pro Ultrabooks<br />&amp; Creators
                  </h3>
                  <Link
                    href="/products?category=electronics"
                    className="inline-flex items-center gap-1 text-xs font-bold text-white hover:text-orange-200 transition-colors"
                  >
                    Shop Now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="relative w-24 h-24 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80&auto=format&fit=crop"
                    alt="Laptop"
                    fill
                    className="object-contain"
                  />
                </div>
              </article>

              {/* Supporting Card 4: Audio (Green Bento) */}
              <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#15803D] to-[#166534] text-white p-6 shadow-md flex items-center justify-between min-h-[160px] group">
                <div className="bento-sparkle" />
                <div className="relative z-10 space-y-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-green-200">
                    Audio
                  </span>
                  <h3 className="text-lg font-bold leading-tight">
                    Acoustic Buds<br />&amp; Speakers
                  </h3>
                  <Link
                    href="/products?category=electronics"
                    className="inline-flex items-center gap-1 text-xs font-bold text-white hover:text-green-200 transition-colors"
                  >
                    Shop Now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="relative w-24 h-24 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&q=80&auto=format&fit=crop"
                    alt="Audio Gear"
                    fill
                    className="object-contain"
                  />
                </div>
              </article>

              {/* Supporting Card 5: Gadgets / Dark Slate Bento */}
              <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white p-6 shadow-md flex items-center justify-between min-h-[160px] group border border-slate-800">
                <div className="bento-sparkle" />
                <div className="relative z-10 space-y-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Accessories
                  </span>
                  <h3 className="text-lg font-bold leading-tight">
                    Smart Home<br />&amp; Essentials
                  </h3>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Shop Now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="relative w-24 h-24 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=400&q=80&auto=format&fit=crop"
                    alt="Smart Home Accessories"
                    fill
                    className="object-contain"
                  />
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED PRODUCTS (4–8 Products) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Handpicked Picks
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Featured Products
            </h2>
          </div>
          <Link
            href="/products?featured=true"
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 px-4 py-2 rounded-xl transition-all"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            No products loaded yet. You can run database seeding to populate sample items.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {featuredProducts.map((product: any) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 3. SHOP BY CATEGORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <Layers className="w-3.5 h-3.5" /> Department Catalog
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 px-4 py-2 rounded-xl transition-all"
          >
            All Products <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {curatedCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                href={`/products?category=${cat.slug}`}
                className="group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center space-y-3"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-100 relative overflow-hidden group-hover:scale-105 transition-transform duration-300 shadow-inner">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">{cat.count}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. WHY SHOPNOVA? (4 Simple Benefits) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-md">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Why ShopNova?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Built with precision for tech lovers who value authenticity, speed, and trusted service.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Benefit 1 */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                <Truck className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Fast Delivery</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                Express tracked dispatch across all major cities with free delivery on orders above ₹1,000.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Secure Payment</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                Integrated with Razorpay 256-bit encryption ensuring every transaction is completely safe.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                <RefreshCw className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Easy Returns</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                30-day hassle-free replacement guarantee. If something isn't right, return or exchange easily.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Trusted Products</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                100% authentic tech curated directly from certified manufacturers and brand distributors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SMALL CTA STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-slate-800">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Ready to upgrade your tech lifestyle?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Browse our complete catalog and checkout in seconds with Razorpay test mode.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all flex-shrink-0"
          >
            Explore Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
