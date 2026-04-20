-- Update copyright text in site_settings
UPDATE public.site_settings 
SET setting_value = jsonb_set(
  setting_value, 
  '{copyright}', 
  '"© 2025 Sua Loja. Todos os direitos reservados."'
)
WHERE setting_key = 'footer';