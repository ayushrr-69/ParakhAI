-- Migration to create a team performance view
-- This helps calculate "Team Quality" and "Coach Statistics" efficiently

CREATE OR REPLACE VIEW public.team_performance_metrics AS
SELECT 
    cs.coach_id,
    COUNT(cs.id) as total_submissions,
    AVG(es.quality_score) as avg_team_quality,
    AVG(es.consistency_score) as avg_team_consistency,
    SUM(es.total_reps) as total_team_reps,
    MAX(es.quality_score) as top_quality_score
FROM 
    public.coach_submissions cs
JOIN 
    public.exercise_sessions es ON cs.session_id = es.id
GROUP BY 
    cs.coach_id;

-- Grant permissions (RLS handles underlying table access, but views need explicit grants)
GRANT SELECT ON public.team_performance_metrics TO authenticated;

-- Add a comment for clarity
COMMENT ON VIEW public.team_performance_metrics IS 'Aggregated performance metrics for coaching teams';
