import mongoose, { Schema, Document } from 'mongoose';
import { SystemConfig } from '@/types'; 
import { CitySchema } from './models/City';

interface ISystemConfigDocument extends SystemConfig, Document {}

const SystemConfigSchema = new Schema<ISystemConfigDocument>({
  key: { 
    type: String, 
    required: true, 
    unique: true, 
    default: 'network_data' 
  },
  
  // The 49x49 Distance Matrix
  distMatrix: { 
    type: Schema.Types.Mixed, 
    required: true 
  },

  // Array of City Objects (Uses the sub-schema)
  hubs: [CitySchema],

  // Array of Arrays of City Objects
  // Example: [[{id:1...}, {id:2...}], [{id:5...}]]
  clusters: {
    type: Schema.Types.Mixed,
    default: [] 
  }
}, { timestamps: true });

export default mongoose.models.SystemConfig || mongoose.model<ISystemConfigDocument>('SystemConfig', SystemConfigSchema);