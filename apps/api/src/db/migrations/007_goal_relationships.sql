-- Add goal_id foreign key to tasks and partners tables
-- This enables strategic relationship mapping: tasks and partners roll up to goals

ALTER TABLE tasks ADD COLUMN goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;
ALTER TABLE partners ADD COLUMN goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;

CREATE INDEX idx_tasks_goal_id ON tasks(goal_id) WHERE goal_id IS NOT NULL;
CREATE INDEX idx_partners_goal_id ON partners(goal_id) WHERE goal_id IS NOT NULL;
