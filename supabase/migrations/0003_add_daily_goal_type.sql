-- Add 'daily' to the goal_type enum

ALTER TYPE goal_type ADD VALUE IF NOT EXISTS 'daily';
