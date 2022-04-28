START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `lexart_cube`.`technologies` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `plataform` VARCHAR(50) NOT NULL DEFAULT 'WEB',
  PRIMARY KEY (`id`)
) ENGINE = InnoDB;

CREATE TABLE `lexart_cube`.`user_skills` (
  `idUser` INT NOT NULL,
  `idTechnology` INT NOT NULL,
  PRIMARY KEY (`idUser`, `idTechnology`),
  FOREIGN KEY (idUser) REFERENCES users(id),
  FOREIGN KEY (idTechnology) REFERENCES technologies(id)
) ENGINE = InnoDB;

COMMIT;
