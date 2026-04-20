-- Add order_number column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(64) UNIQUE;

-- Create index for fast searching
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Update existing orders with order_number (if any exist without it)
UPDATE orders 
SET order_number = 'ORD-' || EXTRACT(EPOCH FROM created_at)::bigint || '-' || substring(id::text, 1, 8)
WHERE order_number IS NULL;