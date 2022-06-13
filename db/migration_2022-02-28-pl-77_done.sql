USE lexart_cube;

ALTER TABLE users
ADD idCompany INT DEFAULT NULL;

ALTER TABLE users ADD FOREIGN KEY (idCompany) REFERENCES companies(id);

UPDATE users SET idCompany = 1;