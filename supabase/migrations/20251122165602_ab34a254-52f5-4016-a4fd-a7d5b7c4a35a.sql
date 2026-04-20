-- Add hidden_by column to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS hidden_by TEXT[] DEFAULT '{}';