import mongoose, { Schema, Document } from 'mongoose';
import { City } from '@/types';

interface ICityDocument extends City, Document {}

// 1. Define the base Schema
// We set _id: false because when this is used inside SystemConfig, 
// we don't want Mongoose generating unique ObjectIds for every single city entry.
export const CitySchema = new Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true }
}, { _id: false });

// 2. Define the Collection Schema
// For the actual 'cities' collection, we DO want standard Mongoose behavior (with _ids),
// so we create a new schema that inherits or re-defines the fields.
const CityCollectionSchema = new Schema<ICityDocument>({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true }
});

// Export the Model (for dropdowns)
export default mongoose.models.City || mongoose.model<ICityDocument>('City', CityCollectionSchema);