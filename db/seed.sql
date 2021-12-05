USE lexart_cube;

INSERT INTO
  `careers` (`position`)
VALUES
  ('EntryLevel Developer'),
  ('FrontEnd Developer'),
  ('FullStack Developer'),
  ('Jr. Software Architect'),
  ('Software Architect'),
  ('Lead Software Architect'),
  ('Solution Architect'),
  ('IA/ML Developer'),
  ('IA/ML Architect'),
  ('Research Developer'),
  ('Research Architect');
INSERT INTO
  `levels` (`level`)
VALUES
  ('Junior'),
  ('Pleno'),
  ('Senior'),
  ('Technical lead'),
  ('Team Lead'),
  ('IA/ML'),
  ('Data Science');
   
-- Evaluaciones

INSERT INTO `evaluations`
	(`id`, `idUser`, `idLextracking`, `name`, `active`, `json_data`, `json_clases`, `json_pagos`, `json_evaluaciones`, `dateCreated`, `dateEdited`)
VALUES
(15, 1, 37, 'Evaluación Octubre', 1, '{\"id\": 15, \"name\": \"Evaluación Octubre\", \"user\": {\"id\": 34, \"name\": \"Alex Dev\", \"type\": \"developer\", \"email\": \"alex@lexartcube.com\", \"token\": \"\", \"active\": 1, \"idUser\": 1, \"password\": \"b75bd008d5fecb1f50cf026532e8ae67\", \"dateEdited\": \"2021-11-03T12:20:23.000Z\", \"dateCreated\": \"2021-11-03T12:20:23.000Z\", \"idLextracking\": 37}, \"fecha\": \"2021-11-11T18:00\", \"users\": [], \"active\": 1, \"resources\": [], \"json_pagos\": [], \"indicadores\": {\"desempeño\": [{\"name\": \"Responsabilidad\", \"total\": 0}, {\"name\": \"Exactitud y calidad\", \"total\": 0}, {\"name\": \"Entregas en fecha\", \"total\": 0}, {\"name\": \"Productividad\", \"total\": 0}, {\"name\": \"Orden y claridad del trabajo\", \"total\": 0}, {\"name\": \"Status de su trabajo\", \"total\": 0}, {\"name\": \"Capacidad de realización\", \"total\": 0}, {\"name\": \"Comprensión de situaciones\", \"total\": 0}, {\"name\": \"Sentido Común\", \"total\": \"3\"}, {\"name\": \"Cumplimiento de los procedimientos existentes\", \"total\": \"3\"}, {\"name\": \"Grado de Conocimiento Técnico\", \"total\": \"4\"}, {\"name\": \"Grado de Conocimiento funcional\", \"total\": \"4\"}], \"habilidades\": [{\"name\": \"Iniciativa\", \"total\": 0}, {\"name\": \"Creatividad\", \"total\": 0}, {\"name\": \"Adaptabilidad\", \"total\": 0}, {\"name\": \"Respuesta bajo presión\", \"total\": 0}, {\"name\": \"Capacidad de manejar múltiples tareas\", \"total\": 0}, {\"name\": \"Coordinación y Liderazgo\", \"total\": 0}, {\"name\": \"Potencialidad.\", \"total\": 0}], \"factorHumano\": [{\"name\": \"Actitud hacia la Empresa\", \"total\": 0}, {\"name\": \"Actitud hacia superiores\", \"total\": 0}, {\"name\": \"Actitud hacia los Compañeros\", \"total\": 0}, {\"name\": \"Actitud con el cliente\", \"total\": 0}, {\"name\": \"Cooperación con el equipo\", \"total\": 0}, {\"name\": \"Capacidad de aceptar críticas\", \"total\": 0}, {\"name\": \"Capacidad de generar sugerencias constructivas\", \"total\": 0}, {\"name\": \"Predisposición\", \"total\": 0}]}, \"observaciones\": \"- Estudiar más\\n- Pedir trabajo, no sea vago\\n- Tomar más caña en horario laboral\", \"json_evaluaciones\": []}', '[]', '[]', '[]', '2021-11-11 15:04:54', '2021-11-11 15:04:54'),
(16, 38, NULL, 'Test', 1, '{\"id\": 0, \"name\": \"Test\", \"user\": {\"id\": 36, \"name\": \"Juan Casadevall\", \"type\": \"developer\", \"email\": \"juan@lexartlabs.com\", \"token\": \"\", \"active\": 1, \"idUser\": 38, \"password\": \"f5737d25829e95b9c234b7fa06af8736\", \"dateEdited\": \"2021-11-11T18:50:12.000Z\", \"dateCreated\": \"2021-11-11T18:50:12.000Z\", \"idLextracking\": 8}, \"fecha\": \"2021-11-11T18:50:35\", \"users\": [], \"active\": 1}', NULL, NULL, NULL, '2021-11-11 15:50:46', '2021-11-11 15:50:46');

-- User_career_level

INSERT INTO `user_position_level`
	(`idPosition`, `idLevel`, `idUser`)
VALUES
	(1, 1, 1),
    (1, 1, 37),
    (1, 1, 38),
    (1, 1, 8);

-- Users

INSERT INTO `users`
	(`id`, `idUser`, `idLextracking`, `name`, `email`, `type`, `password`, `token`, `active`, `dateCreated`, `dateEdited`)
VALUES
(33, 1, 1, 'Alex Casadevall', 'alex@lexartlabs.com', 'admin', 'a6ad53f372887b0d78ffe8a2d9f9b026', '68E7E0A5B2E7A5BEEFC2486B82263EE3E97AC780', 1, '2021-11-03 09:20:00', '2021-11-03 09:20:00'),
(34, 1, 37, 'Alex Dev', 'alex@lexartcube.com', 'developer', 'b75bd008d5fecb1f50cf026532e8ae67', '1DED12653488DF20A630509F8FA7D0572DEE971C', 1, '2021-11-03 09:20:23', '2021-11-11 15:17:01'),
(35, 38, 38, 'Alex PM', 'alexpm@lexartlabs.com', 'pm', 'b75bd008d5fecb1f50cf026532e8ae67', '9F9D59BDDD05C05548FCCCAC1EEE5804221C0E09', 1, '2021-11-11 15:35:00', '2021-11-11 15:35:00'),
(36, 38, 8, 'Juan Casadevall', 'juan@lexartlabs.com', 'developer', 'f5737d25829e95b9c234b7fa06af8736', '', 1, '2021-11-11 15:50:12', '2021-11-11 15:50:12');
