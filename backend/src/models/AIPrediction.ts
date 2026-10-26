import mongoose, { Schema, Document } from 'mongoose';

export interface IAIPrediction extends Document {
  predictionId: string;
  type: string;
  targetId?: string;
  prediction: number;
  aiModel: string;
  modelVersion: string;
  timestamp: Date;
  confidence?: number;
  featuresUsed?: any;
  recommendation?: string;
}

const AIPredictionSchema: Schema = new Schema({
  predictionId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  targetId: { type: String },
  prediction: { type: Number, required: true },
  aiModel: { type: String, required: true },
  modelVersion: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  confidence: { type: Number },
  featuresUsed: { type: Schema.Types.Mixed },
  recommendation: { type: String }
}, {
  timestamps: true
});

export default mongoose.model<IAIPrediction>('AIPrediction', AIPredictionSchema);
