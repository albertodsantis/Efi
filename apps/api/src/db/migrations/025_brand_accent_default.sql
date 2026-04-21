-- Update the default accent for new user_settings rows to the Efi brand gradient.
-- Existing rows are left untouched so users who picked an accent keep theirs.
ALTER TABLE user_settings
  ALTER COLUMN accent_color SET DEFAULT 'gradient:efi';
