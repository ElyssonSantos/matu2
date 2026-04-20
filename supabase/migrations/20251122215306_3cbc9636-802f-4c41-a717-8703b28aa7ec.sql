-- Add club pricing fields to products table
ALTER TABLE products
ADD COLUMN price_club NUMERIC,
ADD COLUMN is_club_discount BOOLEAN DEFAULT false;