-- Adiciona o papel ADMIN ao enum user_role.
--
-- RODE ESTA MIGRATION SOZINHA, separada da seguinte.
-- O Postgres não permite usar um valor de enum na mesma transação em que ele
-- é criado, então as políticas que referenciam 'ADMIN' ficam na migration
-- 20260914000001.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'ADMIN';
