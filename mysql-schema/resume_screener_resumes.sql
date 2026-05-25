DROP TABLE IF EXISTS `resumes`;
CREATE TABLE `resumes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidate_id` int NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` text,
  `extracted_text` longtext,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `file_guid` varchar(255) DEFAULT NULL,
  `original_file_name` varchar(255) DEFAULT NULL,
  `stored_file_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `candidate_id` (`candidate_id`),
  CONSTRAINT `resumes_ibfk_1` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
