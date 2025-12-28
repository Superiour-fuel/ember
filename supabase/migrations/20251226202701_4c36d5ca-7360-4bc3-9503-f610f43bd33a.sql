-- Add emergency contact phone field to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN emergency_contact_phone TEXT;