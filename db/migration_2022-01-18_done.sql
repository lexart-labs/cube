CREATE TABLE `lexart_cube`.`lead_dev_logs` (
  `idDev` INT NOT NULL,
  `idLead` INT NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idDev`, `idLead`)
) ENGINE = InnoDB;