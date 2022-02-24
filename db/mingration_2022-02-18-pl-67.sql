CREATE TABLE `lexart_cube`.`hiring_plataforms` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `plataform` VARCHAR(150) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE (`plataform`)
) ENGINE = InnoDB;

ALTER TABLE `users`
ADD `idPlataform` INT DEFAULT NULL;

ALTER TABLE users ADD FOREIGN KEY (idPlataform) REFERENCES hiring_plataforms(id);