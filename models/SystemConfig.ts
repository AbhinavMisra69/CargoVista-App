import mongoose, { Schema } from "mongoose";

const SystemConfigSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "network_data",
    },
    distMatrix: {
      type: Schema.Types.Mixed,
      required: true,
    },
    hubs: {
      type: [Schema.Types.Mixed],
      required: true,
    },
    clusters: {
      type: Schema.Types.Mixed,
      default: [],
    },
  },
  { timestamps: true }
);

export const SystemConfig =
  mongoose.models.SystemConfig ||
  mongoose.model("SystemConfig", SystemConfigSchema);
