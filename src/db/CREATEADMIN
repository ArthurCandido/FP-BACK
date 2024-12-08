DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuario WHERE usuario.tipo = 'admin') THEN
      INSERT INTO usuario (cpf, email, senha, tipo) VALUES
      ('00000000000', 'admin@admin.com', 'admin', 'admin');
    END IF;
END $$;

