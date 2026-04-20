-- Add DELETE policy for notifications (admins/managers can delete)
CREATE POLICY "Admins can delete notifications"
ON notifications
FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Add scheduled_time column for scheduled notifications
ALTER TABLE notifications
ADD COLUMN scheduled_time timestamp with time zone;