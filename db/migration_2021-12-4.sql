START TRANSACTION;
SET time_zone = "+00:00";
CREATE DATABASE `lexart_cube`;

USE lexart_cube;

ALTER TABLE users
ADD idPosition int(11) NOT NULL DEFAULT 1;

CREATE TABLE careers (
  id int(11) NOT NULL AUTO_INCREMENT,
  position varchar(200) NOT NULL,
  active tinyint(2) DEFAULT 1,
  dateCreated datetime DEFAULT current_timestamp(),
  dateEdited datetime DEFAULT current_timestamp(),
  PRIMARY KEY (id)
);

CREATE TABLE levels (
  id int(11) NOT NULL AUTO_INCREMENT,
  level varchar(200) NOT NULL,
  active tinyint(2) DEFAULT 1,
  dateCreated datetime DEFAULT current_timestamp(),
  dateEdited datetime DEFAULT current_timestamp(),
  PRIMARY KEY (id)
);

-- RELATION

CREATE TABLE user_position_level (
  id int(11) NOT NULL AUTO_INCREMENT,
  idPosition int(11) NOT NULL,
  idLevel int(11) NOT NULL,
  idUser int(11) NOT NULL,
  active tinyint(2) DEFAULT 1,
  dateCreated datetime DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY idPosition (idPosition),
  KEY idLevel (idLevel),
  CONSTRAINT user_position_level_ibfk_1 FOREIGN KEY (idPosition) REFERENCES careers (id),
  -- CONSTRAINT user_position_level_ibfk_2 FOREIGN KEY (idUser) REFERENCES users (idLextracking),
  CONSTRAINT user_position_level_ibfk_3 FOREIGN KEY (idLevel) REFERENCES levels (id)
);

ALTER TABLE users ADD FOREIGN KEY (idPosition) REFERENCES user_position_level (id);

COMMIT;
