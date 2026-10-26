import Recommendation from '../models/Recommendation';
import * as mlService from './mlService';

export const getRecommendations = async (filter: any = {}, skip: number = 0, limit: number = 10) => {
  const data = await Recommendation.find(filter)
    .sort({ opportunityScore: -1 })
    .skip(skip)
    .limit(limit);
  const total = await Recommendation.countDocuments(filter);
  return { data, total };
};

export const getTopRecommendations = async () => {
  const top = await Recommendation.find()
    .sort({ opportunityScore: -1 })
    .limit(5)
    .lean();
    
  // Enhance with real ML scores if available
  for (const rec of top) {
    const mlScore = await mlService.getStationOpportunity(
      (rec as any).estimatedCost || 50, 
      (rec as any).demandScore || 50, 
      (rec as any).zone || 'Central'
    );
    if (mlScore && mlScore.success) {
      rec.opportunityScore = mlScore.opportunityScore;
      (rec as any).mlModelUsed = true;
    }
  }
    
  // Sort again after applying ML scores
  return top.sort((a, b) => b.opportunityScore - a.opportunityScore);
};

export const getRecommendationById = async (id: string) => {
  return await Recommendation.findById(id);
};
