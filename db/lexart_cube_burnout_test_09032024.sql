CREATE TABLE IF NOT EXISTS `burnout_tests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idUser` int NOT NULL,
  `value` json NOT NULL,
  `score` int NOT NULL,
  `dateCreated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateEdited` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idUser` (`idUser`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `burnout_tests`
--
ALTER TABLE `burnout_tests`
  ADD CONSTRAINT `burnout_tests_ibfk_1` FOREIGN KEY (`idUser`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
COMMIT;