-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: mysqldb_cube:3306
-- Tiempo de generación: 05-01-2024 a las 19:55:15
-- Versión del servidor: 8.2.0
-- Versión de PHP: 8.2.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `lexart_cube`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `careers`
--

CREATE TABLE `careers` (
  `id` int NOT NULL,
  `position` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `active` tinyint DEFAULT '1',
  `dateCreated` datetime DEFAULT CURRENT_TIMESTAMP,
  `dateEdited` datetime DEFAULT CURRENT_TIMESTAMP,
  `roadmap` text,
  `idCompany` int NOT NULL DEFAULT '1',
  `idCareerType` int NOT NULL DEFAULT '1',
  `minimumTime` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `careers`
--

INSERT INTO `careers` (`id`, `position`, `active`, `dateCreated`, `dateEdited`, `roadmap`, `idCompany`, `idCareerType`, `minimumTime`) VALUES
(1, 'FullStack Developer L1', 1, '2021-12-05 20:56:20', '2021-12-05 20:56:20', '[\"test\",\"bicho\",\"test\"]', 1, 1, 365),
(2, 'FullStack Developer L2', 1, '2021-12-05 20:56:20', '2021-12-05 20:56:20', NULL, 1, 1, 365),
(3, 'FullStack Developer L3', 1, '2021-12-05 20:56:20', '2021-12-05 20:56:20', NULL, 1, 1, 365),
(4, 'Software Architect L1', 1, '2021-12-05 20:56:20', '2021-12-05 20:56:20', '[\"Rollinga\",\"Rollup\",\"Pepo\"]', 1, 1, 365),
(5, 'Software Architect L2', 1, '2021-12-05 20:56:20', '2021-12-05 20:56:20', NULL, 1, 1, 365),
(6, 'Software Architect L3', 1, '2021-12-05 20:56:20', '2021-12-05 20:56:20', NULL, 1, 1, 365),
(7, 'Solution Architect', 1, '2021-12-05 20:56:20', '2021-12-05 20:56:20', '[\"Rollup\",\"Rollinga\"]', 1, 1, 0),
(12, 'CFO', 1, '2023-12-15 22:01:46', '2023-12-15 22:01:46', '[]', 1, 4, 365),
(13, 'CEO', 1, '2023-12-15 22:01:53', '2023-12-15 22:01:53', '[]', 1, 4, 365),
(14, 'Chairman', 1, '2023-12-15 22:01:57', '2023-12-15 22:01:57', '[]', 1, 4, 365),
(15, 'CTO', 1, '2023-12-15 22:02:00', '2023-12-15 22:02:00', '[]', 1, 4, 365);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `careers_type`
--

CREATE TABLE `careers_type` (
  `id` int NOT NULL,
  `careerName` varchar(255) NOT NULL,
  `idCompany` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `careers_type`
--

INSERT INTO `careers_type` (`id`, `careerName`, `idCompany`) VALUES
(4, 'C-Level', 1),
(1, 'Development', 1),
(3, 'HR', 1),
(2, 'Support', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `colaborators_continuity`
--

CREATE TABLE `colaborators_continuity` (
  `id` int NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `continuity` int NOT NULL,
  `idColaborator` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `companies`
--

CREATE TABLE `companies` (
  `id` int NOT NULL,
  `company` varchar(150) NOT NULL,
  `email` varchar(100) NOT NULL,
  `slug` varchar(150) NOT NULL,
  `active` tinyint DEFAULT '1',
  `isPremium` tinyint DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `companies`
--

INSERT INTO `companies` (`id`, `company`, `email`, `slug`, `active`, `isPremium`) VALUES
(1, 'Lexart', 'contacto@lexartlabs.com', 'lexart_labs', 1, 1),
(2, 'JBlexartlabs', 'jeferson.bonfim@lexartlabs.com', 'jblexartlabs', 1, 1),
(4, 'demo', 'alex@demo.io', 'demo', 1, 1),
(5, 'Fumero', 'Jeehsanttos@yahoo.com.br', 'fumero', 1, 1),
(6, 'Fumero 2', 'Jefy_2000@hotmail.com', 'fumero_2', 1, 1),
(10, 'coderhouse', 'admin@coderhouse.lexartlabs.com', 'coderhouse', 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `evaluations`
--

CREATE TABLE `evaluations` (
  `id` int NOT NULL,
  `idUser` int DEFAULT NULL,
  `idLextracking` int DEFAULT NULL,
  `name` text NOT NULL,
  `active` tinyint DEFAULT '1',
  `json_data` json NOT NULL,
  `json_clases` json DEFAULT NULL,
  `json_pagos` json DEFAULT NULL,
  `json_evaluaciones` json DEFAULT NULL,
  `dateCreated` datetime DEFAULT CURRENT_TIMESTAMP,
  `dateEdited` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Volcado de datos para la tabla `evaluations`
--

INSERT INTO `evaluations` (`id`, `idUser`, `idLextracking`, `name`, `active`, `json_data`, `json_clases`, `json_pagos`, `json_evaluaciones`, `dateCreated`, `dateEdited`) VALUES
(154, 33, 105, 'Test', 1, '{\"id\": 154, \"name\": \"Test\", \"user\": {\"id\": 105, \"name\": \"Rafa\", \"type\": \"pm\", \"email\": \"test@test.com\", \"level\": \"Junior\", \"token\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTcwNDQ3MTcwNSwiZXhwIjoxNzA1MDc2NTA1fQ.TdBa5ZhzBAdOQNUSotVmeh5LOTQ_0ZikLIerei9Dd1w\", \"active\": 1, \"idUser\": 33, \"position\": \"FullStack Developer L1\", \"idCompany\": 1, \"plataform\": \"Trybe\", \"dateEdited\": \"2024-01-05T19:21:45.000Z\", \"idPosition\": 74, \"dateCreated\": \"2024-01-05T16:55:33.000Z\", \"idPlataform\": 1, \"idCareerType\": 1, \"idLextracking\": null}, \"fecha\": \"2024-01-06T16:30:25\", \"users\": [], \"active\": 1, \"resources\": [], \"json_pagos\": [], \"indicadores\": {\"desempeño\": [{\"name\": \"Responsabilidad\", \"total\": \"4\"}, {\"name\": \"Exactitud y calidad\", \"total\": 3}, {\"name\": \"Entregas en fecha\", \"total\": 3}, {\"name\": \"Productividad\", \"total\": 3}, {\"name\": \"Orden y claridad del trabajo\", \"total\": 3}, {\"name\": \"Status de su trabajo\", \"total\": 3}, {\"name\": \"Capacidad de realización\", \"total\": 3}, {\"name\": \"Comprensión de situaciones\", \"total\": 3}, {\"name\": \"Sentido Común\", \"total\": 3}, {\"name\": \"Cumplimiento de los procedimientos existentes\", \"total\": 3}, {\"name\": \"Grado de Conocimiento Técnico\", \"total\": 3}, {\"name\": \"Grado de Conocimiento funcional\", \"total\": 3}], \"habilidades\": [{\"name\": \"Iniciativa\", \"total\": 3}, {\"name\": \"Creatividad\", \"total\": 3}, {\"name\": \"Adaptabilidad\", \"total\": 3}, {\"name\": \"Respuesta bajo presión\", \"total\": 3}, {\"name\": \"Capacidad de manejar múltiples tareas\", \"total\": 3}, {\"name\": \"Coordinación y Liderazgo\", \"total\": 3}, {\"name\": \"Potencialidad.\", \"total\": 3}], \"factorHumano\": [{\"name\": \"Actitud hacia la Empresa\", \"total\": 3}, {\"name\": \"Actitud hacia superiores\", \"total\": 3}, {\"name\": \"Actitud hacia los Compañeros\", \"total\": 3}, {\"name\": \"Actitud con el cliente\", \"total\": 3}, {\"name\": \"Cooperación con el equipo\", \"total\": 3}, {\"name\": \"Capacidad de aceptar críticas\", \"total\": 3}, {\"name\": \"Capacidad de generar sugerencias constructivas\", \"total\": 3}, {\"name\": \"Predisposición\", \"total\": 3}]}, \"observaciones\": \"Coco is loco\", \"json_evaluaciones\": []}', '[]', '[]', '[]', '2024-01-05 16:30:39', '2024-01-05 16:30:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `hiring_plataforms`
--

CREATE TABLE `hiring_plataforms` (
  `id` int NOT NULL,
  `plataform` varchar(150) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `hiring_plataforms`
--

INSERT INTO `hiring_plataforms` (`id`, `plataform`, `createdAt`, `updatedAt`) VALUES
(1, 'Trybe', '2022-02-28 15:26:44', '2022-02-28 15:26:44'),
(2, 'Comunidad JavaScript Facebook', '2022-02-28 15:26:58', '2022-02-28 15:26:58'),
(3, 'Comunidad PHP Facebook', '2022-02-28 15:27:09', '2022-02-28 15:27:09'),
(4, 'Linkedin', '2022-02-28 15:27:21', '2022-02-28 15:27:21'),
(5, 'ex-Alumnos', '2022-02-28 15:34:03', '2022-03-27 16:46:02');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `lead_dev_logs`
--

CREATE TABLE `lead_dev_logs` (
  `idDev` int NOT NULL,
  `idLead` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `lead_dev_logs`
--

INSERT INTO `lead_dev_logs` (`idDev`, `idLead`, `createdAt`) VALUES
(1, 1, '2024-01-05 12:46:59');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `levels`
--

CREATE TABLE `levels` (
  `id` int NOT NULL,
  `level` varchar(200) NOT NULL,
  `active` tinyint DEFAULT '1',
  `idCompany` int NOT NULL DEFAULT '1',
  `idCareerType` int NOT NULL DEFAULT '1',
  `dateCreated` datetime DEFAULT CURRENT_TIMESTAMP,
  `dateEdited` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `levels`
--

INSERT INTO `levels` (`id`, `level`, `active`, `idCompany`, `idCareerType`, `dateCreated`, `dateEdited`) VALUES
(1, 'Junior', 1, 1, 1, '2021-12-05 20:56:20', '2021-12-05 20:56:20'),
(2, 'Pleno', 1, 1, 1, '2021-12-05 20:56:20', '2021-12-05 20:56:20'),
(3, 'Senior', 1, 1, 1, '2021-12-05 20:56:20', '2021-12-05 20:56:20');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `teams`
--

CREATE TABLE `teams` (
  `id` int NOT NULL,
  `idLead` int NOT NULL,
  `team` longtext,
  `name` varchar(100) NOT NULL,
  `mainStack` longtext,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `technologies`
--

CREATE TABLE `technologies` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `plataform` varchar(50) NOT NULL DEFAULT 'WEB'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `technologies`
--

INSERT INTO `technologies` (`id`, `name`, `plataform`) VALUES
(1, 'Vue JS', 'Web'),
(2, 'React', 'Web'),
(3, 'AngularJS', 'Web'),
(4, 'NodeJS', 'Web'),
(5, 'PHP', 'Web'),
(6, 'Python', 'Web'),
(7, 'React Native', 'Mobile'),
(8, 'Flutter', 'Mobile'),
(9, 'Javascript', 'Web'),
(10, 'Laravel', 'Web'),
(11, 'WordPress', 'Web'),
(12, 'Svelte', 'Web');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `idUser` int DEFAULT NULL,
  `idLextracking` int DEFAULT NULL,
  `name` text NOT NULL,
  `email` varchar(100) NOT NULL,
  `type` text NOT NULL,
  `password` text NOT NULL,
  `token` text,
  `active` tinyint DEFAULT '1',
  `dateCreated` datetime DEFAULT CURRENT_TIMESTAMP,
  `dateEdited` datetime DEFAULT CURRENT_TIMESTAMP,
  `idPosition` int DEFAULT NULL,
  `idPlataform` int DEFAULT NULL,
  `idCompany` int DEFAULT NULL,
  `idCareerType` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `idUser`, `idLextracking`, `name`, `email`, `type`, `password`, `token`, `active`, `dateCreated`, `dateEdited`, `idPosition`, `idPlataform`, `idCompany`, `idCareerType`) VALUES
(33, 1, 1, 'Alex Casadevall', 'alex@lexartlabs.com', 'admin', '16d7a4fca7442dda3ad93c9a726597e4', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiYWxleEBsZXhhcnRsYWJzLmNvbSIsImlhdCI6MTcwNDQ2MTIxMCwiZXhwIjoxNzA1MDY2MDEwfQ.taF-wMgETgbxJtBieU_aK90l5ehKtDqDSlYlTfwdzu4', 1, '2021-11-03 01:13:12', '2024-01-05 13:26:50', 73, NULL, 1, 1),
(105, 33, NULL, 'Rafa', 'test@test.com', 'pm', 'a354bd4ebfde1dffbe3b0c59b811fffc', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTcwNDQ3MTcwNSwiZXhwIjoxNzA1MDc2NTA1fQ.TdBa5ZhzBAdOQNUSotVmeh5LOTQ_0ZikLIerei9Dd1w', 1, '2024-01-05 13:55:33', '2024-01-05 16:21:45', 74, 1, 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_payments`
--

CREATE TABLE `user_payments` (
  `id` int NOT NULL,
  `idUser` int NOT NULL,
  `salary` double(20,2) NOT NULL,
  `currency` varchar(20) DEFAULT NULL,
  `billing` varchar(20) DEFAULT 'hour',
  `datePromotion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_position_level`
--

CREATE TABLE `user_position_level` (
  `id` int NOT NULL,
  `idPosition` int NOT NULL,
  `idLevel` int NOT NULL,
  `idUser` int NOT NULL,
  `active` tinyint DEFAULT '1',
  `dateCreated` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `user_position_level`
--

INSERT INTO `user_position_level` (`id`, `idPosition`, `idLevel`, `idUser`, `active`, `dateCreated`) VALUES
(73, 4, 2, 33, 1, '2024-01-05 13:02:41'),
(74, 1, 1, 105, 1, '2024-01-05 13:55:47');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_skills`
--

CREATE TABLE `user_skills` (
  `idUser` int NOT NULL,
  `idTechnology` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `user_skills`
--

INSERT INTO `user_skills` (`idUser`, `idTechnology`) VALUES
(33, 2),
(33, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_skills_per_position`
--

CREATE TABLE `user_skills_per_position` (
  `idUser` int NOT NULL,
  `skills` longtext,
  `idPosition` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `user_skills_per_position`
--

INSERT INTO `user_skills_per_position` (`idUser`, `skills`, `idPosition`, `createdAt`, `updatedAt`) VALUES
(33, '\"{\\\"Rollinga\\\":true,\\\"Rollup\\\":true}\"', 73, '2024-01-05 13:02:41', '2024-01-05 13:26:50'),
(105, '\"{}\"', 74, '2024-01-05 13:55:47', '2024-01-05 16:21:45');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `careers`
--
ALTER TABLE `careers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_career_position` (`position`,`idCompany`,`idCareerType`),
  ADD KEY `FK_company` (`idCompany`),
  ADD KEY `FK_career_type` (`idCareerType`);

--
-- Indices de la tabla `careers_type`
--
ALTER TABLE `careers_type`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `careerName` (`careerName`,`idCompany`),
  ADD KEY `fk_idCompany_careersType_companies` (`idCompany`);

--
-- Indices de la tabla `colaborators_continuity`
--
ALTER TABLE `colaborators_continuity`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_colaborators_continuity` (`month`,`year`,`idColaborator`),
  ADD KEY `idColaborator` (`idColaborator`);

--
-- Indices de la tabla `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indices de la tabla `evaluations`
--
ALTER TABLE `evaluations`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `hiring_plataforms`
--
ALTER TABLE `hiring_plataforms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `plataform` (`plataform`);

--
-- Indices de la tabla `lead_dev_logs`
--
ALTER TABLE `lead_dev_logs`
  ADD PRIMARY KEY (`idDev`,`idLead`);

--
-- Indices de la tabla `levels`
--
ALTER TABLE `levels`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `teams`
--
ALTER TABLE `teams`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `technologies`
--
ALTER TABLE `technologies`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idLextracking` (`idLextracking`),
  ADD UNIQUE KEY `uq_users_email_company` (`email`,`idCompany`),
  ADD KEY `idLextracking_2` (`idLextracking`),
  ADD KEY `idPlataform` (`idPlataform`),
  ADD KEY `idCompany` (`idCompany`),
  ADD KEY `fk_idCareerType_users_careersType` (`idCareerType`);

--
-- Indices de la tabla `user_payments`
--
ALTER TABLE `user_payments`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `user_position_level`
--
ALTER TABLE `user_position_level`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idPosition` (`idPosition`),
  ADD KEY `idLevel` (`idLevel`);

--
-- Indices de la tabla `user_skills`
--
ALTER TABLE `user_skills`
  ADD PRIMARY KEY (`idUser`,`idTechnology`),
  ADD KEY `idTechnology` (`idTechnology`);

--
-- Indices de la tabla `user_skills_per_position`
--
ALTER TABLE `user_skills_per_position`
  ADD PRIMARY KEY (`idUser`,`idPosition`),
  ADD KEY `idPosition` (`idPosition`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `careers`
--
ALTER TABLE `careers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `careers_type`
--
ALTER TABLE `careers_type`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `colaborators_continuity`
--
ALTER TABLE `colaborators_continuity`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `evaluations`
--
ALTER TABLE `evaluations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=155;

--
-- AUTO_INCREMENT de la tabla `hiring_plataforms`
--
ALTER TABLE `hiring_plataforms`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `levels`
--
ALTER TABLE `levels`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `teams`
--
ALTER TABLE `teams`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `technologies`
--
ALTER TABLE `technologies`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=106;

--
-- AUTO_INCREMENT de la tabla `user_payments`
--
ALTER TABLE `user_payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT de la tabla `user_position_level`
--
ALTER TABLE `user_position_level`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `careers`
--
ALTER TABLE `careers`
  ADD CONSTRAINT `FK_career_type` FOREIGN KEY (`idCareerType`) REFERENCES `careers_type` (`id`),
  ADD CONSTRAINT `FK_company` FOREIGN KEY (`idCompany`) REFERENCES `companies` (`id`);

--
-- Filtros para la tabla `careers_type`
--
ALTER TABLE `careers_type`
  ADD CONSTRAINT `fk_idCompany_careersType_companies` FOREIGN KEY (`idCompany`) REFERENCES `companies` (`id`);

--
-- Filtros para la tabla `colaborators_continuity`
--
ALTER TABLE `colaborators_continuity`
  ADD CONSTRAINT `colaborators_continuity_ibfk_1` FOREIGN KEY (`idColaborator`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_idCareerType_users_careersType` FOREIGN KEY (`idCareerType`) REFERENCES `careers_type` (`id`),
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`idPlataform`) REFERENCES `hiring_plataforms` (`id`),
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`idCompany`) REFERENCES `companies` (`id`);

--
-- Filtros para la tabla `user_position_level`
--
ALTER TABLE `user_position_level`
  ADD CONSTRAINT `user_position_level_ibfk_1` FOREIGN KEY (`idPosition`) REFERENCES `careers` (`id`),
  ADD CONSTRAINT `user_position_level_ibfk_3` FOREIGN KEY (`idLevel`) REFERENCES `levels` (`id`);

--
-- Filtros para la tabla `user_skills`
--
ALTER TABLE `user_skills`
  ADD CONSTRAINT `user_skills_ibfk_2` FOREIGN KEY (`idTechnology`) REFERENCES `technologies` (`id`);

--
-- Filtros para la tabla `user_skills_per_position`
--
ALTER TABLE `user_skills_per_position`
  ADD CONSTRAINT `user_skills_per_position_ibfk_1` FOREIGN KEY (`idUser`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `user_skills_per_position_ibfk_2` FOREIGN KEY (`idPosition`) REFERENCES `user_position_level` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
