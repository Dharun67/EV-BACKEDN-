from src.training.train_demand import train_demand_model
from src.training.train_revenue import train_revenue_model
from src.prediction.stationOpportunityService import calculate_opportunity_scores

def run_all():
    print("Starting ML Pipeline Training...")
    
    print("\n--- Training Demand Model ---")
    train_demand_model()
    
    print("\n--- Training Revenue Model ---")
    train_revenue_model()
    
    print("\n--- Calculating Station Opportunity Scores ---")
    calculate_opportunity_scores()
    
    print("\nML Pipeline Complete!")

if __name__ == '__main__':
    run_all()
