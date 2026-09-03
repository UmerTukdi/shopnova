import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAddress extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  fullName: string;
  phone: string;
  label: 'Home' | 'Work' | 'Other';
  addressLine1: string;
  addressLine2?: string;
  addressLine?: string; // backward-compatibility alias
  apartment?: string;    // backward-compatibility alias
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    label: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, default: '', trim: true },
    addressLine: { type: String, trim: true },
    apartment: { type: String, default: '' },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: 'India', trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AddressSchema.index({ user: 1, isDefault: -1 });

// Ensure addressLine1 and addressLine stay in sync
AddressSchema.pre('save', function () {
  if (this.addressLine1 && !this.addressLine) {
    this.addressLine = this.addressLine1;
  } else if (this.addressLine && !this.addressLine1) {
    this.addressLine1 = this.addressLine;
  }
  if (this.addressLine2 && !this.apartment) {
    this.apartment = this.addressLine2;
  } else if (this.apartment && !this.addressLine2) {
    this.addressLine2 = this.apartment;
  }
});

const Address: Model<IAddress> = mongoose.models.Address || mongoose.model<IAddress>('Address', AddressSchema);

export default Address;
