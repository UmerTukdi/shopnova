import { connectDB } from '@/lib/db';
import Product from '@/models/Product';
import ProductDetailClient from './ProductDetailClient';
import mongoose from 'mongoose';
import { notFound } from 'next/navigation';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { id } = await params;
  await connectDB();

  let product = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    product = await Product.findById(id).lean();
  }
  if (!product) {
    product = await Product.findOne({ slug: id }).lean();
  }

  if (!product) return { title: 'Product Not Found - ShopNova' };

  return {
    title: `${product.name} - ShopNova`,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  await connectDB();

  let product = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    product = await Product.findById(id).lean();
  }
  if (!product) {
    product = await Product.findOne({ slug: id }).lean();
  }

  if (!product) {
    notFound();
  }

  const parsedProduct = JSON.parse(JSON.stringify(product));

  return <ProductDetailClient product={parsedProduct} />;
}
