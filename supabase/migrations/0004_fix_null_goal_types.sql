-- Fix any goals that have a NULL type value (set them to 'monthly' as default)
UPDATE goals SET type = 'monthly' WHERE type IS NULL;
