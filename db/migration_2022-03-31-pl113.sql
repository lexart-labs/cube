CREATE TABLE careers_type (
    id int(11) PRIMARY KEY AUTO_INCREMENT,
    careerName varchar(255) NOT NULL,
    idCompany int(11) NOT NULL,
    CONSTRAINT fk_idCompany_careersType_companies FOREIGN KEY (idCompany) REFERENCES companies(id),
    UNIQUE KEY (careerName, idCompany)
) ENGINE = InnoDB;
INSERT INTO careers_type (careerName, idCompany)
VALUES
("Development", 1);
ALTER TABLE users ADD COLUMN idCareerType int(11) NOT NULL DEFAULT 1;
ALTER TABLE users ADD CONSTRAINT fk_idCareerType_users_careersType FOREIGN KEY (idCareerType) REFERENCES careers_type(id);