import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  brand?: string;
  category: string;
  tags?: string[];
  price: number;
  originalPrice: number;
  mrp: number;
  discount: number;
  stock: number;
  image: string;
  images?: string[];
  rating: number;
  numReviews: number;
  reviews?: IReview[];
  featured?: boolean;
  isBestSeller?: boolean;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    brand: { type: String, default: 'ShopNova' },
    category: { type: String, required: true, index: true },
    tags: [{ type: String }],
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0 },
    stock: { type: Number, required: true, min: 0, default: 10 },
    image: { type: String, required: true },
    images: [{ type: String }],
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    reviews: [ReviewSchema],
    featured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', description: 'text', brand: 'text', category: 'text' });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
