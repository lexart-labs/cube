START TRANSACTION;

ALTER TABLE `careers` CHANGE `position` `position` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL;

ALTER TABLE careers 
	ADD `roadmap` varchar(255) DEFAULT "[]",
    ADD `idCompany` INT(11) NOT NULL DEFAULT 1,
    ADD `idCareerType` INT(11) NOT NULL DEFAULT 1;
    
ALTER TABLE careers
ADD CONSTRAINT FK_company
FOREIGN KEY (idCompany) REFERENCES companies(id);

ALTER TABLE careers
ADD CONSTRAINT FK_career_type
FOREIGN KEY (idCareerType) REFERENCES careers_type(id);

ALTER TABLE careers
ADD CONSTRAINT unique_career_position UNIQUE(position, idCompany, idCareerType);


COMMIT;