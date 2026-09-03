import { connectDB } from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import ProductCard from '@/components/ProductCard';
import SortSelector from './SortSelector';
import Link from 'next/link';
import { PackageX, Search, Sparkles } from 'lucide-react';

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    featured?: string;
    bestSeller?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export const metadata = {
  title: 'Products & Tech Catalog — ShopNova',
  description: 'Explore cutting-edge tech, electronics, laptops, wearables, audio, and accessories at ShopNova.',
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const { search, category, featured, bestSeller, sort = 'newest', minPrice, maxPrice } = params;

  await connectDB();

  const categories = await Category.find({}).lean();

  const filter: any = { isDeleted: { $ne: true } };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
    ];
  }

  if (category && category !== 'all') {
    filter.category = category.toLowerCase();
  }

  if (featured === 'true') {
    filter.featured = true;
  }

  if (bestSeller === 'true') {
    filter.isBestSeller = true;
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  let sortOptions: any = { createdAt: -1 };
  if (sort === 'price_asc') sortOptions = { price: 1 };
  if (sort === 'price_desc') sortOptions = { price: -1 };
  if (sort === 'newest') sortOptions = { createdAt: -1 };

  const productsRaw = await Product.find(filter).sort(sortOptions).lean();
  const products = JSON.parse(JSON.stringify(productsRaw));
  const categoriesParsed = JSON.parse(JSON.stringify(categories));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-16">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Curated Technology
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {search ? (
              <span>Search results for &ldquo;{search}&rdquo;</span>
            ) : category && category !== 'all' ? (
              <span className="capitalize">{category} Collection</span>
            ) : featured === 'true' ? (
              <span>Featured Deals</span>
            ) : (
              <span>All Products</span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Showing {products.length} {products.length === 1 ? 'item' : 'items'} in store
          </p>
        </div>

        {/* Sorting selector */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Sort By:</label>
          <SortSelector
            sort={sort}
            search={search}
            category={category}
            featured={featured}
            bestSeller={bestSeller}
          />
        </div>
      </div>

      {/* Category Pills Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Link
          href="/products"
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            !category || category === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Products
        </Link>
        {categoriesParsed.map((cat: any) => {
          const isActive = category?.toLowerCase() === cat.slug?.toLowerCase();
          return (
            <Link
              key={cat._id}
              href={`/products?category=${cat.slug}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>

      {/* Product Grid or Empty State */}
      {products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 max-w-md mx-auto my-12 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <PackageX className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Products Found</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {search
              ? `We couldn't find any products matching "${search}". Try searching for another keyword or clear filters.`
              : 'There are currently no products in this category.'}
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all"
            >
              Clear Filters
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
          {products.map((product: any) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
