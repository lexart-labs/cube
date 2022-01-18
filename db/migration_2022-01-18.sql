CREATE TABLE `lexart_cube`.`user_skills_per_position` (
  `idUser` INT NOT NULL,
  `skills` LONGTEXT NULL,
  `idPosition` INT NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idUser, idPosition),
  FOREIGN KEY (idUser) REFERENCES users(id),
  FOREIGN KEY (idPosition) REFERENCES user_position_level(id)
) ENGINE = InnoDB;
