-- Production Monitor SQL Script
-- Run this in Supabase SQL Editor

CREATE OR REPLACE VIEW accuracy_by_s_zone AS
SELECT 
  CASE 
    WHEN s_value > 15 THEN 'Strong Blue'
    WHEN s_value < -15 THEN 'Strong Red'
    ELSE 'Balanced'
  END as zone,
  COUNT(*) as total_predictions,
  SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_predictions,
  (SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::FLOAT / COUNT(*)) * 100 as accuracy_pct
FROM predictions
GROUP BY 
  CASE 
    WHEN s_value > 15 THEN 'Strong Blue'
    WHEN s_value < -15 THEN 'Strong Red'
    ELSE 'Balanced'
  END;
