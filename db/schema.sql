-- CRUD
CREATE TABLE users (
	id int NOT NULL AUTO_INCREMENT,
	name text NOT NULL,
	email varchar(100) NOT NULL,
	type text NOT NULL,
	password text NOT NULL,
	active tinyint(2) DEFAULT 1,
	dateCreated datetime DEFAULT current_timestamp,
	dateEdited datetime DEFAULT current_timestamp,
	PRIMARY KEY (id),
	UNIQUE(email)
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