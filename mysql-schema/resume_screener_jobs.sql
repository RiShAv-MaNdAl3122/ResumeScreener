DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` longtext NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `version` int DEFAULT '1',
  `last_modified_by` int DEFAULT NULL,
  `last_modified_at` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Active',
  `department` varchar(100) DEFAULT 'Engineering',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_jobs_modified_by` (`last_modified_by`),
  CONSTRAINT `fk_jobs_modified_by` FOREIGN KEY (`last_modified_by`) REFERENCES `users` (`id`),
  CONSTRAINT `jobs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
