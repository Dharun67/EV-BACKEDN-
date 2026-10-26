import mongoose, { Schema, Document } from 'mongoose';

export interface IRecommendation extends Document {
  recommendationId: string;
  location: {
    type: string;
    coordinates: number[];
  };
  opportunityScore: number;
  demandScore: number;
  infrastructureGap: number;
  evGrowth: number;
  accessibility: number;
  revenuePotential: number;
  recommendedChargers: number;
  chargerMix: {
    ac: number;
    dc: number;
    ultra: number;
  };
  estimatedInvestment: number;
  estimatedAnnualRevenue: number;
  estimatedRoi: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'PLANNED' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSchema: Schema = new Schema({
  recommendationId: { type: String, required: true, unique: true, index: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  opportunityScore: { type: Number, required: true },
  demandScore: { type: Number, default: 0 },
  infrastructureGap: { type: Number, default: 0 },
  evGrowth: { type: Number, default: 0 },
  accessibility: { type: Number, default: 0 },
  revenuePotential: { type: Number, default: 0 },
  recommendedChargers: { type: Number, default: 0 },
  chargerMix: {
    ac: { type: Number, default: 0 },
    dc: { type: Number, default: 0 },
    ultra: { type: Number, default: 0 }
  },
  estimatedInvestment: { type: Number, default: 0 },
  estimatedAnnualRevenue: { type: Number, default: 0 },
  estimatedRoi: { type: Number, default: 0 },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM' 
  },
  status: { 
    type: String, 
    enum: ['NEW', 'PLANNED', 'APPROVED', 'REJECTED'],
    default: 'NEW' 
  }
}, {
  timestamps: true
});

RecommendationSchema.index({ location: '2dsphere' });

export default mongoose.model<IRecommendation>('Recommendation', RecommendationSchema);
