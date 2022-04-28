ALTER TABLE users DROP INDEX email;
ALTER TABLE users ADD CONSTRAINT uq_users_email_company UNIQUE (email, idCompany);