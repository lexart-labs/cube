CREATE TABLE `lexart_cube`.`colaborators_continuity` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `month` INT(2) NOT NULL,
  `year` INT(4) NOT NULL,
  `continuity` INT NOT NULL,
  `idColaborator` INT NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB;

ALTER TABLE colaborators_continuity ADD FOREIGN KEY (idColaborator) REFERENCES users(id);

ALTER TABLE colaborators_continuity ADD CONSTRAINT uq_colaborators_continuity UNIQUE (month, year, idColaborator);
