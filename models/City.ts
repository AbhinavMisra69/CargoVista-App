import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. Define the Interface
export interface ICity extends Document {
  id: number;
  name: string;
  lat: number;
  lon: number;
  clusterId?: number; 
}

// 2. Define the Schema
export const CitySchema: Schema = new Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  clusterId: { type: Number },
});

// 3. Create the Model (Prevent Overwrite)
// This check is crucial for Next.js hot-reloading
const City: Model<ICity> = mongoose.models.City || mongoose.model<ICity>('City', CitySchema);

export default City;
