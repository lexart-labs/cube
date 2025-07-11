CREATE TABLE IF NOT EXISTS `candidates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fullName` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `country` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `englishLevel` enum('None', 'Basic', 'Intermediate', 'Advanced', 'Native') DEFAULT 'None',
  `spanishLevel` enum('None', 'Basic', 'Intermediate', 'Advanced', 'Native') DEFAULT 'None',
  `portugueseLevel` enum('None', 'Basic', 'Intermediate', 'Advanced', 'Native') DEFAULT 'None',
  `source` varchar(100) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `github` varchar(255) DEFAULT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `cv` varchar(255) DEFAULT NULL,
  `is_benching` BOOLEAN DEFAULT FALSE,
  `dateCreated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE candidates
ADD COLUMN principal_stack VARCHAR(100) DEFAULT NULL AFTER is_benching;
