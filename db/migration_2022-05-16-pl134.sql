ALTER TABLE `companies` ADD `openToExternalRelations` BOOLEAN NOT NULL DEFAULT FALSE AFTER `isPremium`;

CREATE TABLE `companies_external_relations` (
  `id` int(11) NOT NULL,
  `idCompany1` int(11) NOT NULL,
  `idCompany2` int(11) NOT NULL,
  `company1_accepted` tinyint(1) NOT NULL DEFAULT 0,
  `company2_accepted` tinyint(1) NOT NULL DEFAULT 0,
  `dateCreated` timestamp NOT NULL DEFAULT current_timestamp(),
  `dateEdited` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `companies_external_relations`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `companies_external_relations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

ALTER TABLE `companies_external_relations`
  ADD CONSTRAINT `companies_external_relations_ibfk_1` FOREIGN KEY (`idCompany1`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `companies_external_relations_ibfk_2` FOREIGN KEY (`idCompany2`) REFERENCES `companies` (`id`);
COMMIT;