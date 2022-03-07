CREATE TABLE `lexart_cube`.`companies` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `company` VARCHAR(150) NOT NULL,
  `email` varchar(100) NOT NULL,
  `slug` VARCHAR(150) NOT NULL,
  `active` tinyint(2) DEFAULT 1,
  `isPremium` tinyint(2) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY slug (slug),
) ENGINE = InnoDB;