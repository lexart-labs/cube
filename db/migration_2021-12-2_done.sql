START TRANSACTION;
SET time_zone = "+00:00";
CREATE DATABASE `lexart_cube`;

USE lexart_cube;

-- CRUD
CREATE TABLE users (
  id int(11) NOT NULL AUTO_INCREMENT,
  idUser int(11) DEFAULT NULL,
  idLextracking int(11) DEFAULT NULL,
  name text NOT NULL,
  email varchar(100) NOT NULL,
  type text NOT NULL,
  password text NOT NULL,
  token text DEFAULT NULL,
  active tinyint(2) DEFAULT 1,
  idPosition int(11) DEFAULT NULL,
  dateCreated datetime DEFAULT current_timestamp(),
  dateEdited datetime DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY email (email),
  UNIQUE KEY idLextracking (idLextracking),
  KEY idPosition (idPosition),
  KEY idLextracking_2 (idLextracking)
);

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

CREATE TABLE evaluations (
  id int(11) NOT NULL AUTO_INCREMENT,
  idUser int(11) DEFAULT NULL,
  idLextracking int(11) DEFAULT NULL,
  name text NOT NULL,
  active tinyint(2) DEFAULT '1',
  json_data json NOT NULL,
  json_clases json DEFAULT NULL,
  json_pagos json DEFAULT NULL,
  json_evaluaciones json DEFAULT NULL,
  dateCreated datetime DEFAULT CURRENT_TIMESTAMP,
  dateEdited datetime DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id)
);

CREATE TABLE courses (
	id int NOT NULL AUTO_INCREMENT,
	name text NOT NULL,
	active tinyint(2) DEFAULT 1,
	dateCreated datetime DEFAULT current_timestamp,
	dateEdited datetime DEFAULT current_timestamp,
	PRIMARY KEY (id)
);

CREATE TABLE resources (
	id int NOT NULL AUTO_INCREMENT,
	name text NOT NULL,
	description text NOT NULL,
	link text NOT NULL,
	type text NOT NULL,
	active tinyint(2) DEFAULT 1,
	dateCreated datetime DEFAULT current_timestamp,
	dateEdited datetime DEFAULT current_timestamp,
	PRIMARY KEY (id)
);

-- RELATION
CREATE TABLE user_course (
	id int NOT NULL AUTO_INCREMENT,
	idUser int NOT NULL,
	idCourse int NOT NULL,
	active tinyint(2) DEFAULT 1,
	dateCreated datetime DEFAULT current_timestamp,
	dateEdited datetime DEFAULT current_timestamp,
	PRIMARY KEY (id),
	FOREIGN KEY (idUser) REFERENCES users(id),
	FOREIGN KEY (idCourse) REFERENCES courses(id)
);

CREATE TABLE course_resource (
	id int NOT NULL AUTO_INCREMENT,
	idResource int NOT NULL,
	idCourse int NOT NULL,
	active tinyint(2) DEFAULT 1,
	dateCreated datetime DEFAULT current_timestamp,
	dateEdited datetime DEFAULT current_timestamp,
	PRIMARY KEY (id),
	FOREIGN KEY (idResource) REFERENCES resources(id),
	FOREIGN KEY (idCourse) REFERENCES courses(id)
);

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
