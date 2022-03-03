CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    slug varchar(255) NOT NULL,
    active tinyint NOT NULL,
    isPremium tinyint NOT NULL
) ENGINE = InnoDB;