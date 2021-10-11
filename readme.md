# Atlas Education
## Simple education managment platform

# RoadMap v1.0.0

## Database
- MYSQL: CRUD

	- users
		- id, name, email, password, type, dateCreated, dateEdited, active
		- keys: id [PK], email [UNIQUE]

	- courses
		- id, name, dateCreated, dateEdited, active

	- resources
		- id, name, description, link, type (video, file), dateCreated, dateEdited, active

- MYSQL: RELATION

	- user_course
		- id, idUser, idCourse, dateCreated, dateEdited, active
		- keys: id, idUser, idCourse

	- course_resource
		- id, idCourse, idResource, active


## Backend
- Stack: NodeJS
	- POST: Login
	- GET: Courses by user
	- GET: Resources by course
	- Using basic middleware

## Frontend
- Stack: VueJS

## Security test
- ToDo

## Server reference/deploy
- Backend 
	- w: server134-school.lexartlabs.com/atlas-educ-v1/ 
	- db: atlas_education_v1
- WebApp
	- w: school.lexartlabs.com/atlas-education-v1
	- u: lexcasa@gmail.com
	- p: alex123School

# RoadMap v1.1.0

## Security
- Add userId in headers [x]
- Middleware verification with token and userId [x]
- Allow courses only if user has rel with this [x] 

## Features
- ABM Users [x]
	- Add user [x]
	- Edit user [x]
	- Enable/Disable [x]

- ABM Courses [x]
- Send email to users with user and password
- ABM Clases
- ABM Pruebas
