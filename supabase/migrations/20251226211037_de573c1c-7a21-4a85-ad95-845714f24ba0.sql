-- Add emergency contact method preference (whatsapp or sms)
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS emergency_contact_method text DEFAULT 'whatsapp';