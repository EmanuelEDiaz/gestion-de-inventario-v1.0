-- V3: Corregir password hash del admin
-- Password: admin123 (bcrypt cost=12)
UPDATE users 
SET password_hash = '$2a$12$h5JE8J0/smJeGRmYPD8TGepWGFK2XkrLr2RgluHfHj09ZzMlnyQzW'
WHERE username = 'admin';
