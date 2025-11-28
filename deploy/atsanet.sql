-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: atsa
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `acudiente`
--

DROP TABLE IF EXISTS `acudiente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acudiente` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idacudiente` int NOT NULL,
  `nom1_acudiente` varchar(20) NOT NULL,
  `nom2_acudiente` varchar(20) DEFAULT NULL,
  `ape1_acudiente` varchar(20) NOT NULL,
  `ape2_acudiente` varchar(20) DEFAULT NULL,
  `tel_acudiente` bigint NOT NULL,
  `parentesco` varchar(9) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acudiente`
--

LOCK TABLES `acudiente` WRITE;
/*!40000 ALTER TABLE `acudiente` DISABLE KEYS */;
INSERT INTO `acudiente` VALUES (1,200000001,'Carlos','Eduardo','Ramírez',NULL,3119876543,'Abuelo'),(2,200000002,'Ana',NULL,'Pérez','López',3109876543,'Abuelo'),(3,200000003,'Jorge',NULL,'Torres','Rojas',3145678901,'Padre'),(4,200000004,'Patricia',NULL,'Díaz',NULL,3112346788,'Abuelo'),(5,200000005,'Alejandro','Carlos','Herrera',NULL,3123456789,'Abuelo'),(6,200000006,'María',NULL,'Castillo','Pérez',3159874321,'Madre'),(7,200000007,'Luis',NULL,'Morales','Rojas',3145671234,'Hermano'),(8,200000008,'Claudia',NULL,'Díaz',NULL,3176541234,'Hermano'),(9,200000009,'Ricardo','Esteban','López','Herrera',3145678901,'Padre'),(10,200000010,'Sandra',NULL,'Ramírez',NULL,3176543210,'Madre'),(11,200000011,'Fernando',NULL,'Rojas',NULL,3124567890,'Abuelo'),(12,200000012,'María','Fernanda','Gómez','Vargas',3156781234,'Hermano'),(13,200000013,'Juan',NULL,'Díaz',NULL,3145671235,'Abuelo'),(14,200000014,'Ana',NULL,'Morales',NULL,3109876543,'Madre'),(15,200000015,'Jorge','Eduardo','Díaz','Torres',3176544321,'Hermano'),(16,200000016,'Patricia','Sofía','Herrera','Gómez',3123456789,'Tio'),(17,200000017,'Luis',NULL,'Pérez',NULL,3159874321,'Padre'),(18,200000018,'Claudia','Andrea','Gómez',NULL,3109876543,'Madre'),(19,200000019,'Ricardo',NULL,'Díaz','Rojas',3145678901,'Abuelo'),(20,200000020,'Sandra','Patricia','Castillo',NULL,3176543210,'Hermano'),(21,200000021,'Carlos',NULL,'Ramírez','Gómez',3101112233,'Tio'),(22,200000022,'Ana',NULL,'Morales',NULL,3102223344,'Madre'),(23,200000023,'Jorge','Andrés','López','Ramírez',3103334455,'Tio'),(24,200000024,'Patricia',NULL,'Rojas',NULL,3104445566,'Hermano'),(25,200000025,'Alejandro','Carlos','Herrera',NULL,3105556677,'Hermano'),(26,200000026,'María',NULL,'Ramírez',NULL,3106667788,'Hermano'),(27,200000027,'Luis','Fernando','Castillo','Ramírez',3107778899,'Padre'),(28,200000028,'Claudia',NULL,'Díaz',NULL,3108889900,'Madre'),(29,200000029,'Ricardo','Esteban','López',NULL,3109990011,'Tio'),(30,200000030,'Sandra',NULL,'Morales',NULL,3111112233,'Hermano');
/*!40000 ALTER TABLE `acudiente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alumno`
--

DROP TABLE IF EXISTS `alumno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumno` (
  `fk_persona_alumno` int NOT NULL,
  `foto` varchar(100) DEFAULT NULL,
  `traDatos` varchar(100) DEFAULT NULL,
  `autoMedica` varchar(100) DEFAULT NULL,
  `certEps` varchar(100) DEFAULT NULL,
  `altura_metros` double DEFAULT NULL,
  `peso_medidas` double DEFAULT NULL,
  `imc_medidas` double DEFAULT NULL,
  `talla` varchar(4) DEFAULT NULL,
  `calzado` int DEFAULT NULL,
  `pie_dominante` varchar(11) DEFAULT NULL,
  `estado_alumno` tinyint(1) DEFAULT NULL,
  `postulante` tinyint(1) DEFAULT NULL,
  `fk_acudiente` int NOT NULL,
  `fk_posicion` int NOT NULL,
  `otraEscuela` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`fk_persona_alumno`),
  KEY `alumno_fk_acudiente_7564a6ae_fk_acudiente_id` (`fk_acudiente`),
  KEY `alumno_fk_posicion_a506929a_fk_posicion_idposicion` (`fk_posicion`),
  CONSTRAINT `alumno_fk_acudiente_7564a6ae_fk_acudiente_id` FOREIGN KEY (`fk_acudiente`) REFERENCES `acudiente` (`id`),
  CONSTRAINT `alumno_fk_persona_alumno_10c438a2_fk_persona_id` FOREIGN KEY (`fk_persona_alumno`) REFERENCES `persona` (`id`),
  CONSTRAINT `alumno_fk_posicion_a506929a_fk_posicion_idposicion` FOREIGN KEY (`fk_posicion`) REFERENCES `posicion` (`idposicion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alumno`
--

LOCK TABLES `alumno` WRITE;
/*!40000 ALTER TABLE `alumno` DISABLE KEYS */;
INSERT INTO `alumno` VALUES (1,NULL,NULL,NULL,NULL,1.12,19,15.1,'XXS',23,'Derecho',0,1,1,5,NULL),(2,NULL,NULL,NULL,NULL,1.2,25,17.36,'XXS',23,'Derecho',1,0,2,1,NULL),(3,NULL,NULL,NULL,NULL,1.18,21,15.1,'XXS',24,'Derecho',1,0,3,6,NULL),(4,NULL,NULL,NULL,NULL,1.25,23,14.7,'XS',25,'Derecho',0,0,4,2,NULL),(5,NULL,NULL,NULL,NULL,1.3,25,14.8,'XS',27,'Derecho',1,0,5,3,NULL),(6,NULL,NULL,NULL,NULL,1.35,27,14.8,'XS',28,'Derecho',1,0,6,4,NULL),(7,NULL,NULL,NULL,NULL,1.4,30,15.3,'S',30,'Izquierdo',1,0,7,5,NULL),(8,NULL,NULL,NULL,NULL,1.45,33,15.7,'S',31,'Derecho',1,0,8,1,NULL),(9,NULL,NULL,NULL,NULL,1.5,36,16,'S',33,'Izquierdo',1,0,9,4,NULL),(10,NULL,NULL,NULL,NULL,1.5,36,16,'S',33,'Izquierdo',1,0,10,3,NULL),(11,NULL,NULL,NULL,NULL,1.55,39,16.2,'M',34,'Derecho',0,1,11,6,NULL),(12,NULL,NULL,NULL,NULL,1.65,45,16.5,'M',37,'Derecho',1,0,12,7,NULL),(13,NULL,NULL,NULL,NULL,1.68,50,16.5,'L',37,'Derecho',0,0,13,1,NULL),(14,NULL,NULL,NULL,NULL,1.7,51,16.5,'L',37,'Derecho',0,1,14,2,NULL),(15,NULL,NULL,NULL,NULL,1.7,50,17.3,'L',39,'Izquierdo',1,0,15,7,NULL),(16,NULL,NULL,NULL,NULL,1.75,60,19.6,'L',42,'Derecho',1,0,16,3,NULL),(17,NULL,NULL,NULL,NULL,1.78,63,19.9,'XL',43,'Izquierdo',1,0,17,7,NULL),(18,NULL,NULL,NULL,NULL,1.8,66,20.4,'XL',44,'Izquierdo',1,1,18,1,NULL),(19,NULL,NULL,NULL,NULL,1.06,17,15.1,'XXS',22,'Izquierdo',0,0,19,6,NULL),(20,NULL,NULL,NULL,NULL,1.11,19,15.4,'XXS',23,'Izquierdo',1,0,20,5,NULL),(21,NULL,NULL,NULL,NULL,1.15,20,8.89,'XXS',23,'Izquierdo',1,0,21,1,NULL),(22,NULL,NULL,NULL,NULL,1.17,21,15.3,'XXS',24,'Izquierdo',0,1,22,2,NULL),(23,NULL,NULL,NULL,NULL,1.3,25,14.8,'XS',27,'Izquierdo',1,0,23,4,NULL),(24,NULL,NULL,NULL,NULL,1.34,28,15,'XS',28,'Izquierdo',1,0,24,1,NULL),(25,NULL,NULL,NULL,NULL,1.4,30,15.31,'S',28,'Izquierdo',1,0,25,3,NULL),(26,NULL,NULL,NULL,NULL,1.41,31,15.6,'S',30,'Izquierdo',1,0,26,2,NULL),(27,NULL,NULL,NULL,NULL,1.45,33,15.7,'S',31,'Derecho',0,0,27,1,NULL),(28,NULL,NULL,NULL,NULL,1.5,36,16,'S',33,'Izquierdo',0,0,28,3,NULL),(29,NULL,NULL,NULL,NULL,1.55,39,16.2,'M',34,'Derecho',1,0,29,5,NULL),(30,NULL,NULL,NULL,NULL,1.6,42,16.4,'M',36,'Derecho',1,0,30,2,NULL);
/*!40000 ALTER TABLE `alumno` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asistencia`
--

DROP TABLE IF EXISTS `asistencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asistencia` (
  `idasistencia` int NOT NULL AUTO_INCREMENT,
  `fecha_asistencia` datetime(6) NOT NULL,
  `asistencia` int NOT NULL,
  `observaciones` longtext NOT NULL,
  `fk_matricula_ms` int NOT NULL,
  `fk_sesion_ms` int NOT NULL,
  PRIMARY KEY (`idasistencia`),
  KEY `asistencia_fk_matricula_ms_54b45c9f_fk_matricula_idmatricula` (`fk_matricula_ms`),
  KEY `asistencia_fk_sesion_ms_9a3d3790_fk_sesionentrenamiento_idsesion` (`fk_sesion_ms`),
  CONSTRAINT `asistencia_fk_matricula_ms_54b45c9f_fk_matricula_idmatricula` FOREIGN KEY (`fk_matricula_ms`) REFERENCES `matricula` (`idmatricula`),
  CONSTRAINT `asistencia_fk_sesion_ms_9a3d3790_fk_sesionentrenamiento_idsesion` FOREIGN KEY (`fk_sesion_ms`) REFERENCES `sesionentrenamiento` (`idsesion`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asistencia`
--

LOCK TABLES `asistencia` WRITE;
/*!40000 ALTER TABLE `asistencia` DISABLE KEYS */;
INSERT INTO `asistencia` VALUES (1,'2025-02-02 15:01:00.000000',1,'Asistió puntual',3,1),(2,'2025-02-02 15:00:00.000000',0,'No asistio',4,1),(3,'2025-02-02 15:01:00.000000',1,'Asistió puntual',22,1),(4,'2025-02-02 14:20:00.000000',1,'Asistió con 15 min de retraso',6,2),(5,'2025-02-02 14:11:00.000000',1,'Asistió con 5 min de retraso',7,2),(6,'2025-02-02 14:01:00.000000',1,'Asistió puntual',8,2),(7,'2025-02-02 14:05:00.000000',1,'Asistió puntual',9,2),(8,'2025-02-02 14:15:00.000000',1,'Asistió con 10 min de retraso',24,2),(9,'2025-02-02 14:01:00.000000',1,'Asistió puntual',26,2),(10,'2025-02-02 14:03:00.000000',1,'Asistió puntual',27,2),(11,'2025-02-02 14:05:00.000000',1,'Asistió puntual',28,2);
/*!40000 ALTER TABLE `asistencia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add user',4,'add_user'),(14,'Can change user',4,'change_user'),(15,'Can delete user',4,'delete_user'),(16,'Can view user',4,'view_user'),(17,'Can add content type',5,'add_contenttype'),(18,'Can change content type',5,'change_contenttype'),(19,'Can delete content type',5,'delete_contenttype'),(20,'Can view content type',5,'view_contenttype'),(21,'Can add session',6,'add_session'),(22,'Can change session',6,'change_session'),(23,'Can delete session',6,'delete_session'),(24,'Can view session',6,'view_session'),(25,'Can add acudiente',7,'add_acudiente'),(26,'Can change acudiente',7,'change_acudiente'),(27,'Can delete acudiente',7,'delete_acudiente'),(28,'Can view acudiente',7,'view_acudiente'),(29,'Can add persona',8,'add_persona'),(30,'Can change persona',8,'change_persona'),(31,'Can delete persona',8,'delete_persona'),(32,'Can view persona',8,'view_persona'),(33,'Can add asistencia',9,'add_asistencia'),(34,'Can change asistencia',9,'change_asistencia'),(35,'Can delete asistencia',9,'delete_asistencia'),(36,'Can view asistencia',9,'view_asistencia'),(37,'Can add categoria',10,'add_categoria'),(38,'Can change categoria',10,'change_categoria'),(39,'Can delete categoria',10,'delete_categoria'),(40,'Can view categoria',10,'view_categoria'),(41,'Can add entrenamiento',11,'add_entrenamiento'),(42,'Can change entrenamiento',11,'change_entrenamiento'),(43,'Can delete entrenamiento',11,'delete_entrenamiento'),(44,'Can view entrenamiento',11,'view_entrenamiento'),(45,'Can add habilidad',12,'add_habilidad'),(46,'Can change habilidad',12,'change_habilidad'),(47,'Can delete habilidad',12,'delete_habilidad'),(48,'Can view habilidad',12,'view_habilidad'),(49,'Can add jornada entrenamientos',13,'add_jornadaentrenamientos'),(50,'Can change jornada entrenamientos',13,'change_jornadaentrenamientos'),(51,'Can delete jornada entrenamientos',13,'delete_jornadaentrenamientos'),(52,'Can view jornada entrenamientos',13,'view_jornadaentrenamientos'),(53,'Can add objetivos',14,'add_objetivos'),(54,'Can change objetivos',14,'change_objetivos'),(55,'Can delete objetivos',14,'delete_objetivos'),(56,'Can view objetivos',14,'view_objetivos'),(57,'Can add posicion',15,'add_posicion'),(58,'Can change posicion',15,'change_posicion'),(59,'Can delete posicion',15,'delete_posicion'),(60,'Can view posicion',15,'view_posicion'),(61,'Can add alumno',16,'add_alumno'),(62,'Can change alumno',16,'change_alumno'),(63,'Can delete alumno',16,'delete_alumno'),(64,'Can view alumno',16,'view_alumno'),(65,'Can add personal t',17,'add_personalt'),(66,'Can change personal t',17,'change_personalt'),(67,'Can delete personal t',17,'delete_personalt'),(68,'Can view personal t',17,'view_personalt'),(69,'Can add calificacion objetivos',18,'add_calificacionobjetivos'),(70,'Can change calificacion objetivos',18,'change_calificacionobjetivos'),(71,'Can delete calificacion objetivos',18,'delete_calificacionobjetivos'),(72,'Can view calificacion objetivos',18,'view_calificacionobjetivos'),(73,'Can add categoria entrenamiento',19,'add_categoriaentrenamiento'),(74,'Can change categoria entrenamiento',19,'change_categoriaentrenamiento'),(75,'Can delete categoria entrenamiento',19,'delete_categoriaentrenamiento'),(76,'Can view categoria entrenamiento',19,'view_categoriaentrenamiento'),(77,'Can add matricula',20,'add_matricula'),(78,'Can change matricula',20,'change_matricula'),(79,'Can delete matricula',20,'delete_matricula'),(80,'Can view matricula',20,'view_matricula'),(81,'Can add matricula sesion',21,'add_matriculasesion'),(82,'Can change matricula sesion',21,'change_matriculasesion'),(83,'Can delete matricula sesion',21,'delete_matriculasesion'),(84,'Can view matricula sesion',21,'view_matriculasesion'),(85,'Can add sesionentrenamiento',22,'add_sesionentrenamiento'),(86,'Can change sesionentrenamiento',22,'change_sesionentrenamiento'),(87,'Can delete sesionentrenamiento',22,'delete_sesionentrenamiento'),(88,'Can view sesionentrenamiento',22,'view_sesionentrenamiento'),(89,'Can add entrenamiento objetivo',23,'add_entrenamientoobjetivo'),(90,'Can change entrenamiento objetivo',23,'change_entrenamientoobjetivo'),(91,'Can delete entrenamiento objetivo',23,'delete_entrenamientoobjetivo'),(92,'Can view entrenamiento objetivo',23,'view_entrenamientoobjetivo'),(93,'Can add personal t habilidad',24,'add_personalthabilidad'),(94,'Can change personal t habilidad',24,'change_personalthabilidad'),(95,'Can delete personal t habilidad',24,'delete_personalthabilidad'),(96,'Can view personal t habilidad',24,'view_personalthabilidad'),(97,'Can add personal jornada categoria',25,'add_personaljornadacategoria'),(98,'Can change personal jornada categoria',25,'change_personaljornadacategoria'),(99,'Can delete personal jornada categoria',25,'delete_personaljornadacategoria'),(100,'Can view personal jornada categoria',25,'view_personaljornadacategoria');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user`
--

LOCK TABLES `auth_user` WRITE;
/*!40000 ALTER TABLE `auth_user` DISABLE KEYS */;
INSERT INTO `auth_user` VALUES (1,'pbkdf2_sha256$1000000$LZhAI7kTe6sfyzxcKhk14w$aZb4Y22roAjPL8v1NGBnpMCa1IOEvgvSbQoUr/l2ELU=','2025-11-19 04:32:47.080587',0,'300000001','Carlos','Muñoz','',0,1,'2025-11-19 00:17:17.762353'),(2,'pbkdf2_sha256$1000000$lTwV06qnXOzIbF63IiO8Dy$z+ASOLYoiVUHFW568Dv+SmHgJP6Yx1i5X7wjS1UK1xM=',NULL,0,'300000004','Daniela','Torres','',0,1,'2025-11-19 00:17:18.090940'),(3,'pbkdf2_sha256$1000000$BPGv0pnRIV4UTBVBX2AXtM$ua+bnCpHzVw0DAoe8V3p6MtWRyz+tQCaY3mXea5UDgs=',NULL,0,'300000005','Juan','Herrera','',0,1,'2025-11-19 00:17:18.403958'),(4,'pbkdf2_sha256$1000000$bm1btuE97SBWZDAD3RywlB$QlDXoX+jUmJZTZINNxvG+OizBv2dBwZhOsyQWPHClHc=',NULL,0,'300000006','Camila','Hernadez','',0,1,'2025-11-19 00:17:18.724766'),(5,'pbkdf2_sha256$1000000$QIWJweFUE1yxU70Jffcxx2$Kh9IAelbcdvWd/Aq4s9QuJ5xB9eEvn4lR7jS2RVMJQs=',NULL,0,'300000009','Felipe','Torres','',0,1,'2025-11-19 00:17:19.049401'),(6,'pbkdf2_sha256$1000000$cuXPUNJP4ZEaLy0cJg3kxk$M1C/NkeiK2NRWDU5LKW/IOrMWXZkN4H6FZSab4ZMje8=',NULL,0,'1001001001','Mateo','Pérez','',0,1,'2025-11-19 00:17:19.369860'),(7,'pbkdf2_sha256$1000000$RRXOMYXwhU0adscHHk9VUl$sRbj59exbtG1OXKbGyszbqVW1dlREylfxk9UAwC1LEY=',NULL,0,'1001001005','Daniel','Castro','',0,1,'2025-11-19 00:17:19.693171'),(8,'pbkdf2_sha256$1000000$7snOwF2oNvJpC8hcHqae1I$/9Bwq9XmI0u3tco8mqGiB4Jtzei+zmrQ9rpAag5w9BE=',NULL,0,'1001001008','Tatiana','Rincón','',0,1,'2025-11-19 00:17:20.005245'),(9,'pbkdf2_sha256$1000000$izKnr2pUr6c9uCwHdIHBbn$VKAh0kllD1A8gi18/Pv7U/dgQSCiejmxO6I06Qp7PUw=',NULL,0,'1035544987','Marcos','Vargas','',0,1,'2025-11-19 00:17:20.328323'),(10,'pbkdf2_sha256$1000000$ljVVPF6c1K0JloZcgzDW2Q$dQ3tEocIk6ldpQorZJrZ8/EOhbzs5+tVW2Fox5UxnQ0=',NULL,0,'1034455984','Jaime','Vanegas','',0,1,'2025-11-19 00:17:20.641269');
/*!40000 ALTER TABLE `auth_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_groups`
--

DROP TABLE IF EXISTS `auth_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_groups`
--

LOCK TABLES `auth_user_groups` WRITE;
/*!40000 ALTER TABLE `auth_user_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_user_permissions`
--

DROP TABLE IF EXISTS `auth_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_user_permissions`
--

LOCK TABLES `auth_user_user_permissions` WRITE;
/*!40000 ALTER TABLE `auth_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calificacion_objetivos`
--

DROP TABLE IF EXISTS `calificacion_objetivos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calificacion_objetivos` (
  `idcalificacion` int NOT NULL AUTO_INCREMENT,
  `id_objetivo` int NOT NULL,
  `evaluacion` tinyint(1) NOT NULL,
  `observaciones` longtext NOT NULL,
  `objetivo_evaluado` tinyint(1) NOT NULL,
  `fk_asistencia` int NOT NULL,
  PRIMARY KEY (`idcalificacion`),
  KEY `calificacion_objetiv_fk_asistencia_46957e8f_fk_asistenci` (`fk_asistencia`),
  CONSTRAINT `calificacion_objetiv_fk_asistencia_46957e8f_fk_asistenci` FOREIGN KEY (`fk_asistencia`) REFERENCES `asistencia` (`idasistencia`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calificacion_objetivos`
--

LOCK TABLES `calificacion_objetivos` WRITE;
/*!40000 ALTER TABLE `calificacion_objetivos` DISABLE KEYS */;
INSERT INTO `calificacion_objetivos` VALUES (1,1,1,'Cumplio objetivo',1,1),(2,5,0,'Hay que entrenar fuerza',0,1),(3,7,1,'Cumplio objetivo',1,1),(4,1,1,'Cumplio objetivo',1,2),(5,5,0,'Estuvo un poco lento en los ejercicios',1,2),(6,7,1,'Cumplio objetivo',1,2),(7,1,0,'le falto motivacion',0,3),(8,5,1,'Cumplio objetivo',1,3),(9,7,1,'Cumplio objetivo',0,3);
/*!40000 ALTER TABLE `calificacion_objetivos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categoria`
--

DROP TABLE IF EXISTS `categoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoria` (
  `idcategoria` int NOT NULL AUTO_INCREMENT,
  `nom_categoria` varchar(20) NOT NULL,
  PRIMARY KEY (`idcategoria`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categoria`
--

LOCK TABLES `categoria` WRITE;
/*!40000 ALTER TABLE `categoria` DISABLE KEYS */;
INSERT INTO `categoria` VALUES (1,'4 a 7 años'),(2,'8 a 11 años'),(3,'12 a 15 años'),(4,'16 a 17 años'),(5,'18 años');
/*!40000 ALTER TABLE `categoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categoria_entrenamiento`
--

DROP TABLE IF EXISTS `categoria_entrenamiento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoria_entrenamiento` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `fk_categoria` int NOT NULL,
  `fk_entrenamiento` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categoria_entrenamiento_fk_categoria_fk_entrenam_1dcc9945_uniq` (`fk_categoria`,`fk_entrenamiento`),
  KEY `categoria_entrenamie_fk_entrenamiento_f29c6791_fk_entrenami` (`fk_entrenamiento`),
  CONSTRAINT `categoria_entrenamie_fk_categoria_3a06bf9e_fk_categoria` FOREIGN KEY (`fk_categoria`) REFERENCES `categoria` (`idcategoria`),
  CONSTRAINT `categoria_entrenamie_fk_entrenamiento_f29c6791_fk_entrenami` FOREIGN KEY (`fk_entrenamiento`) REFERENCES `entrenamiento` (`identrenamiento`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categoria_entrenamiento`
--

LOCK TABLES `categoria_entrenamiento` WRITE;
/*!40000 ALTER TABLE `categoria_entrenamiento` DISABLE KEYS */;
INSERT INTO `categoria_entrenamiento` VALUES (1,1,1),(2,1,2),(3,1,3),(4,1,4),(5,2,5),(6,2,6),(7,2,7),(8,3,8),(9,3,9),(10,3,10),(11,4,11),(12,4,12),(13,4,13),(14,5,14),(15,5,15),(16,5,16);
/*!40000 ALTER TABLE `categoria_entrenamiento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(3,'auth','group'),(2,'auth','permission'),(4,'auth','user'),(5,'contenttypes','contenttype'),(7,'partida','acudiente'),(16,'partida','alumno'),(9,'partida','asistencia'),(18,'partida','calificacionobjetivos'),(10,'partida','categoria'),(19,'partida','categoriaentrenamiento'),(11,'partida','entrenamiento'),(23,'partida','entrenamientoobjetivo'),(12,'partida','habilidad'),(13,'partida','jornadaentrenamientos'),(20,'partida','matricula'),(21,'partida','matriculasesion'),(14,'partida','objetivos'),(8,'partida','persona'),(25,'partida','personaljornadacategoria'),(17,'partida','personalt'),(24,'partida','personalthabilidad'),(15,'partida','posicion'),(22,'partida','sesionentrenamiento'),(6,'sessions','session');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2025-11-18 20:52:44.073122'),(2,'auth','0001_initial','2025-11-18 20:52:44.284192'),(3,'admin','0001_initial','2025-11-18 20:52:44.342075'),(4,'admin','0002_logentry_remove_auto_add','2025-11-18 20:52:44.346997'),(5,'admin','0003_logentry_add_action_flag_choices','2025-11-18 20:52:44.351972'),(6,'contenttypes','0002_remove_content_type_name','2025-11-18 20:52:44.395470'),(7,'auth','0002_alter_permission_name_max_length','2025-11-18 20:52:44.418479'),(8,'auth','0003_alter_user_email_max_length','2025-11-18 20:52:44.433208'),(9,'auth','0004_alter_user_username_opts','2025-11-18 20:52:44.438061'),(10,'auth','0005_alter_user_last_login_null','2025-11-18 20:52:44.462742'),(11,'auth','0006_require_contenttypes_0002','2025-11-18 20:52:44.464198'),(12,'auth','0007_alter_validators_add_error_messages','2025-11-18 20:52:44.469054'),(13,'auth','0008_alter_user_username_max_length','2025-11-18 20:52:44.497612'),(14,'auth','0009_alter_user_last_name_max_length','2025-11-18 20:52:44.526184'),(15,'auth','0010_alter_group_name_max_length','2025-11-18 20:52:44.535481'),(16,'auth','0011_update_proxy_permissions','2025-11-18 20:52:44.546529'),(17,'auth','0012_alter_user_first_name_max_length','2025-11-18 20:52:44.575045'),(18,'partida','0001_initial','2025-11-18 20:52:45.274953'),(19,'partida','0002_alumno_otraescuela','2025-11-18 20:52:45.299018'),(20,'sessions','0001_initial','2025-11-18 20:52:45.318438');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
INSERT INTO `django_session` VALUES ('gla3ozmrqqc9zt2k8do6he3h4taurzph','.eJxVjEEOwiAQRe_C2pACQsGle89AZoZBqgaS0q6MdzckXej2v_f-W0TYtxL3zmtckrgIJU6_GwI9uQ6QHlDvTVKr27qgHIo8aJe3lvh1Pdy_gwK9jDqB4wBk0SmvMZlsskdrMxLnYHD2FgOftZsypaBYzaTBEYdJs1POiM8XGkI4zg:1vLZs7:AqkyXzbwAdgC_h_MQQZyWsTSPwLpgR3FkEIhWycL5wk','2025-12-03 04:32:47.085624'),('jthmqog1fwfmu0xwtf37v1f9cdcpz0ra','.eJxVjEEOwiAQRe_C2pACQsGle89AZoZBqgaS0q6MdzckXej2v_f-W0TYtxL3zmtckrgIJU6_GwI9uQ6QHlDvTVKr27qgHIo8aJe3lvh1Pdy_gwK9jDqB4wBk0SmvMZlsskdrMxLnYHD2FgOftZsypaBYzaTBEYdJs1POiM8XGkI4zg:1vLVtG:D8EQbGAYyI9Jd5Op6TOD7WKF6irD9nrlIEPNhb9sQ1A','2025-12-03 00:17:42.383496'),('vxgrr2x8xjin3axb8yiyb42xprjyp2f0','.eJxVjEEOwiAQRe_C2pACQsGle89AZoZBqgaS0q6MdzckXej2v_f-W0TYtxL3zmtckrgIJU6_GwI9uQ6QHlDvTVKr27qgHIo8aJe3lvh1Pdy_gwK9jDqB4wBk0SmvMZlsskdrMxLnYHD2FgOftZsypaBYzaTBEYdJs1POiM8XGkI4zg:1vLXHM:03av3Pq1703YoIu3tQCGZBjJ3yGOI97Ygkay30U2b-U','2025-12-03 01:46:40.227673');
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entrenamiento`
--

DROP TABLE IF EXISTS `entrenamiento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entrenamiento` (
  `identrenamiento` int NOT NULL AUTO_INCREMENT,
  `nom_entrenamiento` varchar(30) NOT NULL,
  `descripcion` longtext NOT NULL,
  `estado` int NOT NULL,
  PRIMARY KEY (`identrenamiento`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entrenamiento`
--

LOCK TABLES `entrenamiento` WRITE;
/*!40000 ALTER TABLE `entrenamiento` DISABLE KEYS */;
INSERT INTO `entrenamiento` VALUES (1,'pases por Tríos','Mejorar precisión y rapidez en pases entre tres jugadores.',1),(2,'mete y corre','Desarrollar rapidez de reacción y coordinación.',1),(3,'sucesion de pases','Mantener continuidad del juego con pases consecutivos.',1),(4,'torpedos','Incrementar velocidad y desmarque en espacios reducidos.',1),(5,'2 contra 1','Tomar decisiones en superioridad numérica.',1),(6,'linea imaginaria','Mejorar disciplina táctica y posición en la cancha.',1),(7,'cada uno en su espacio','Fomentar respeto y distribución en el campo.',1),(8,'pases de la muerte','Aumentar precisión en pases decisivos.',1),(9,'pases y tiro a gol','Mejorar finalización tras recibir pases.',1),(10,'cambios de Orientación','Desarrollar reorganización y cambios de ataque.',1),(11,'superioridad e incorporacion','Entrenar entrada al ataque generando ventaja numérica.',1),(12,'doble pared y tiro','Mejorar combinación rápida y definición cerca del arco.',1),(13,'maniobra y pase','Fomentar control de balón y creatividad en circulación.',1),(14,'6 Porterias pequeñas','Incrementar precisión en tiros y decisiones rápidas.',1),(15,'partido con comodines','Entrenar versatilidad táctica y colaboración.',1),(16,'ejercicios de biometria','Evaluar condición física de cada alumno.',1),(17,'resistencia','Mejorar capacidad aeróbica y resistencia en juego.',1);
/*!40000 ALTER TABLE `entrenamiento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entrenamiento_objetivo`
--

DROP TABLE IF EXISTS `entrenamiento_objetivo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entrenamiento_objetivo` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `fk_entrenamiento` int NOT NULL,
  `fk_objetivo` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `entrenamiento_objetivo_fk_entrenamiento_fk_obje_baf0f0c9_uniq` (`fk_entrenamiento`,`fk_objetivo`),
  KEY `entrenamiento_objeti_fk_objetivo_20e2a7e9_fk_objetivos` (`fk_objetivo`),
  CONSTRAINT `entrenamiento_objeti_fk_entrenamiento_56db8327_fk_entrenami` FOREIGN KEY (`fk_entrenamiento`) REFERENCES `entrenamiento` (`identrenamiento`),
  CONSTRAINT `entrenamiento_objeti_fk_objetivo_20e2a7e9_fk_objetivos` FOREIGN KEY (`fk_objetivo`) REFERENCES `objetivos` (`idobjetivos`)
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entrenamiento_objetivo`
--

LOCK TABLES `entrenamiento_objetivo` WRITE;
/*!40000 ALTER TABLE `entrenamiento_objetivo` DISABLE KEYS */;
INSERT INTO `entrenamiento_objetivo` VALUES (4,1,1),(2,1,2),(5,1,3),(3,1,13),(1,1,15),(6,2,1),(7,2,3),(9,3,1),(8,3,5),(10,3,7),(15,4,1),(16,4,2),(14,4,3),(13,4,12),(11,4,13),(12,4,14),(17,4,16),(21,5,1),(23,5,3),(19,5,5),(24,5,8),(25,5,12),(22,5,22),(20,5,27),(18,5,33),(35,6,1),(27,6,5),(29,6,7),(32,6,8),(30,6,10),(31,6,11),(26,6,12),(28,6,15),(36,6,24),(34,6,29),(33,6,35),(37,7,1),(40,7,2),(42,7,5),(43,7,6),(44,7,9),(41,7,10),(46,7,12),(39,7,13),(45,7,15),(38,7,33),(48,8,6),(50,8,9),(47,8,16),(51,8,21),(49,8,34),(54,9,1),(56,9,2),(53,9,11),(55,9,13),(52,9,28),(59,10,2),(57,10,4),(58,10,5),(61,10,11),(60,10,21),(65,11,1),(67,11,6),(62,11,7),(64,11,12),(63,11,13),(68,11,16),(69,11,32),(66,11,34),(74,12,4),(73,12,5),(70,12,12),(72,12,13),(75,12,14),(71,12,16),(77,13,1),(78,13,5),(81,13,6),(76,13,7),(82,13,11),(80,13,13),(79,13,24),(84,14,4),(83,14,7),(85,14,15),(86,14,32),(92,15,1),(89,15,4),(87,15,6),(88,15,7),(90,15,10),(91,15,14),(93,15,16),(99,16,2),(100,16,6),(94,16,10),(98,16,14),(97,16,15),(95,16,31),(96,16,34),(103,17,3),(101,17,6),(105,17,10),(106,17,15),(102,17,24),(104,17,34);
/*!40000 ALTER TABLE `entrenamiento_objetivo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `habilidad`
--

DROP TABLE IF EXISTS `habilidad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `habilidad` (
  `idhabilidad` int NOT NULL AUTO_INCREMENT,
  `descripcion` longtext NOT NULL,
  PRIMARY KEY (`idhabilidad`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `habilidad`
--

LOCK TABLES `habilidad` WRITE;
/*!40000 ALTER TABLE `habilidad` DISABLE KEYS */;
INSERT INTO `habilidad` VALUES (1,'Comunicación efectiva'),(2,'Liderazgo deportivo'),(3,'Planificación de entrenamientos'),(4,'Motivación de jugadores'),(5,'Evaluación técnica'),(6,'Evaluación física'),(7,'Primeros auxilios'),(8,'Estrategia de juego'),(9,'Control emocional'),(10,'Trabajo en equipo'),(11,'Observación y análisis'),(12,'Desarrollo de talento'),(13,'Manejo de conflictos'),(14,'Gestión del tiempo'),(15,'Enseñanza técnica y táctica');
/*!40000 ALTER TABLE `habilidad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jornada_entrenamientos`
--

DROP TABLE IF EXISTS `jornada_entrenamientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jornada_entrenamientos` (
  `idjornada` int NOT NULL AUTO_INCREMENT,
  `dia_jornada` varchar(7) NOT NULL,
  `hora_entrada` time(6) NOT NULL,
  `hora_salida` time(6) NOT NULL,
  PRIMARY KEY (`idjornada`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jornada_entrenamientos`
--

LOCK TABLES `jornada_entrenamientos` WRITE;
/*!40000 ALTER TABLE `jornada_entrenamientos` DISABLE KEYS */;
INSERT INTO `jornada_entrenamientos` VALUES (1,'martes','14:00:00.000000','16:00:00.000000'),(2,'jueves','14:00:00.000000','16:00:00.000000'),(3,'sábado','14:00:00.000000','16:00:00.000000');
/*!40000 ALTER TABLE `jornada_entrenamientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matricula`
--

DROP TABLE IF EXISTS `matricula`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matricula` (
  `idmatricula` int NOT NULL AUTO_INCREMENT,
  `fecha_inicio` datetime(6) NOT NULL,
  `fecha_fin` datetime(6) DEFAULT NULL,
  `estado_matricula` int NOT NULL,
  `codigo_renovacion` varchar(20) DEFAULT NULL,
  `fk_categoria` int NOT NULL,
  `fk_alumno` int NOT NULL,
  PRIMARY KEY (`idmatricula`),
  UNIQUE KEY `codigo_renovacion` (`codigo_renovacion`),
  KEY `matricula_fk_categoria_5cd2e326_fk_categoria_idcategoria` (`fk_categoria`),
  KEY `matricula_fk_alumno_cd8947df_fk_alumno_fk_persona_alumno` (`fk_alumno`),
  CONSTRAINT `matricula_fk_alumno_cd8947df_fk_alumno_fk_persona_alumno` FOREIGN KEY (`fk_alumno`) REFERENCES `alumno` (`fk_persona_alumno`),
  CONSTRAINT `matricula_fk_categoria_5cd2e326_fk_categoria_idcategoria` FOREIGN KEY (`fk_categoria`) REFERENCES `categoria` (`idcategoria`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matricula`
--

LOCK TABLES `matricula` WRITE;
/*!40000 ALTER TABLE `matricula` DISABLE KEYS */;
INSERT INTO `matricula` VALUES (2,'2024-01-20 00:00:00.000000','2024-11-10 00:00:00.000000',0,NULL,1,2),(3,'2025-01-18 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,1,2),(4,'2025-01-20 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,1,3),(5,'2023-01-21 00:00:00.000000','2025-11-10 00:00:00.000000',0,NULL,1,4),(6,'2025-01-21 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,2,5),(7,'2025-01-20 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,2,6),(8,'2025-01-18 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,2,7),(9,'2025-01-20 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,2,8),(10,'2024-01-18 00:00:00.000000','2024-11-10 00:00:00.000000',0,NULL,3,9),(11,'2025-01-15 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,3,9),(12,'2025-01-18 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,3,10),(13,'2022-01-15 00:00:00.000000','2022-11-10 00:00:00.000000',0,NULL,3,12),(14,'2024-01-20 00:00:00.000000','2024-11-10 00:00:00.000000',0,NULL,3,12),(15,'2025-01-18 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,3,12),(16,'2024-01-15 00:00:00.000000','2025-11-10 00:00:00.000000',0,NULL,4,13),(17,'2025-01-18 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,5,15),(18,'2025-01-18 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,5,16),(19,'2025-01-18 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,5,17),(20,'2022-01-18 00:00:00.000000','2025-11-10 00:00:00.000000',0,NULL,1,19),(21,'2024-01-20 00:00:00.000000','2024-11-10 00:00:00.000000',0,NULL,1,20),(22,'2025-01-15 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,1,20),(23,'2022-01-19 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,1,21),(24,'2025-01-18 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,2,23),(25,'2024-01-19 00:00:00.000000','2024-11-10 00:00:00.000000',0,NULL,2,24),(26,'2025-01-20 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,2,24),(27,'2025-01-22 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,2,25),(28,'2025-01-15 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,2,26),(29,'2024-01-22 00:00:00.000000','2025-11-10 00:00:00.000000',0,NULL,3,27),(30,'2025-01-15 00:00:00.000000','2025-11-10 00:00:00.000000',0,NULL,3,28),(31,'2025-01-15 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,3,29),(32,'2025-01-15 00:00:00.000000','2025-11-10 00:00:00.000000',1,NULL,3,30);
/*!40000 ALTER TABLE `matricula` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matricula_sesion`
--

DROP TABLE IF EXISTS `matricula_sesion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matricula_sesion` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `fk_matricula` int NOT NULL,
  `fk_sesion` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `matricula_sesion_fk_matricula_fk_sesion_993638d9_uniq` (`fk_matricula`,`fk_sesion`),
  KEY `matricula_sesion_fk_sesion_5b21e82c_fk_sesionent` (`fk_sesion`),
  CONSTRAINT `matricula_sesion_fk_matricula_e5721e07_fk_matricula_idmatricula` FOREIGN KEY (`fk_matricula`) REFERENCES `matricula` (`idmatricula`),
  CONSTRAINT `matricula_sesion_fk_sesion_5b21e82c_fk_sesionent` FOREIGN KEY (`fk_sesion`) REFERENCES `sesionentrenamiento` (`idsesion`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matricula_sesion`
--

LOCK TABLES `matricula_sesion` WRITE;
/*!40000 ALTER TABLE `matricula_sesion` DISABLE KEYS */;
INSERT INTO `matricula_sesion` VALUES (1,3,1),(2,4,1),(4,6,2),(5,7,2),(6,8,2),(7,9,2),(3,22,1),(8,24,2),(9,26,2),(10,27,2),(11,28,2);
/*!40000 ALTER TABLE `matricula_sesion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `objetivos`
--

DROP TABLE IF EXISTS `objetivos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `objetivos` (
  `idobjetivos` int NOT NULL AUTO_INCREMENT,
  `nom_objetivo` varchar(70) NOT NULL,
  `descripcion` longtext NOT NULL,
  `estado` int NOT NULL,
  PRIMARY KEY (`idobjetivos`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `objetivos`
--

LOCK TABLES `objetivos` WRITE;
/*!40000 ALTER TABLE `objetivos` DISABLE KEYS */;
INSERT INTO `objetivos` VALUES (1,'control','Sin descripción',1),(2,'pase medio','Sin descripción',1),(3,'calentamiento','Sin descripción',1),(4,'coordinación','Sin descripción',1),(5,'recuperación','Sin descripción',1),(6,'pase corto','Sin descripción',1),(7,'habilidad/Destreza','Sin descripción',1),(8,'conducción','Sin descripción',1),(9,'tiro','Sin descripción',1),(10,'velocidad','Sin descripción',1),(11,'fuerza tren superior','Sin descripción',1),(12,'entrada','Sin descripción',1),(13,'desmarques','Sin descripción',1),(14,'coontrataque','Sin descripción',1),(15,'resistencia','Sin descripción',1),(16,'cambios de orientacion','Sin descripción',1),(17,'competitividad','Sin descripción',1),(18,'paredes','Sin descripción',1),(19,'posesion / ritmo de juego','Sin descripción',1),(20,'comunicación','Sin descripción',1),(21,'regate','Sin descripción',1),(22,'concentracion','Sin descripción',1),(23,'agresividad','Sin descripción',1),(24,'espacios libres','Sin descripción',1),(25,'resistencia anaerobica','Sin descripción',1),(26,'pressing','Sin descripción',1),(27,'repliegues','Sin descripción',1),(28,'pase largo','Sin descripción',1),(29,'creatividad','Sin descripción',1),(30,'cabeza','Sin descripción',1),(31,'salidas','Sin descripción',1),(32,'cohesion grupal','Sin descripción',1),(33,'perfeccionamiento de Habilidades','Sin descripción',1),(34,'acciones combinativas','Sin descripción',1),(35,'resistencia Aerobica','Sin descripción',1),(36,'coberturas','Sin descripción',1),(37,'marcaje zonal','Sin descripción',1);
/*!40000 ALTER TABLE `objetivos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `persona`
--

DROP TABLE IF EXISTS `persona`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `persona` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_persona` int NOT NULL,
  `tipo_identidad` varchar(3) NOT NULL,
  `nom1_persona` varchar(20) NOT NULL,
  `nom2_persona` varchar(20) DEFAULT NULL,
  `ape1_persona` varchar(20) NOT NULL,
  `ape2_persona` varchar(20) DEFAULT NULL,
  `fecha_nacimiento` date NOT NULL,
  `direc_persona` varchar(40) NOT NULL,
  `tel_persona` bigint NOT NULL,
  `email_persona` varchar(40) NOT NULL,
  `genero` varchar(1) NOT NULL,
  `eps` varchar(13) NOT NULL,
  `rh` varchar(3) NOT NULL,
  `fecha_registro` date DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_persona` (`id_persona`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `persona_user_id_95280bfe_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `persona`
--

LOCK TABLES `persona` WRITE;
/*!40000 ALTER TABLE `persona` DISABLE KEYS */;
INSERT INTO `persona` VALUES (1,100000001,'RC','Juan','David','Ramírez',NULL,'2022-06-15','Calle 5 #12-34, Velez',3101234567,'juandavid.ramirez@gmail.com','M','Sura','A+',NULL,NULL),(2,100000002,'RC','Mateo','Santiago','López','Pérez','2021-03-22','Carrera 8 #23-56, Velez',3123456789,'mateo.lopez@hotmail.com','M','Sanitas','B-',NULL,NULL),(3,100000003,'RC','Camila',NULL,'Torres',NULL,'2020-09-10','Calle 10 #34-78, Velez',3156789012,'camila.torres@gmail.com','F','Compensar','A+',NULL,NULL),(4,100000004,'TI','Samuel',NULL,'Gómez','Díaz','2019-05-03','Carrera 12 #45-67, Velez',3176543210,'samuel.gomez@gmail.com','M','Salud Total','B-',NULL,NULL),(5,100000005,'TI','Juan','Carlos','Martínez','Herrera','2018-11-12','Calle 3 #12-34, Velez',3105678901,'juancarlos.martinez@gmail.com','M','Sanitas','A+',NULL,NULL),(6,100000006,'TI','Nicolás','Alejandro','Pérez',NULL,'2017-07-19','Carrera 5 #23-45, Velez',3116789012,'nicolas.perez@gmail.com','M','Compensar','B-',NULL,NULL),(7,100000007,'TI','Isabella',NULL,'Rojas',NULL,'2016-02-27','Calle 8 #34-56, Velez',3109876540,'isabella.rojas@gmail.com','F','Aliansalud','B-',NULL,NULL),(8,100000008,'TI','Daniel','Lucía','Morales','Díaz','2015-08-05','Carrera 10 #45-67, Velez',3123459876,'daniel.morales@hotmail.com','M','Salud Bolívar','A+',NULL,NULL),(9,100000009,'TI','Santiago',NULL,'Herrera',NULL,'2014-05-16','Calle 12 #56-78, Velez',3109871234,'santiago.herrera@gmail.com','M','Sanitas','O-',NULL,NULL),(10,100000010,'TI','Mateo',NULL,'Díaz','Ramírez','2013-03-02','Carrera 14 #67-89, Velez',3112345678,'mateo.diaz@gmail.com','M','Compensar','A+',NULL,NULL),(11,100000011,'TI','Valentina','Sofía','Castillo','Rojas','2012-12-21','Calle 15 #78-90, Velez',3105671234,'valentina.castillo@gmail.com','F','Sura','B+',NULL,NULL),(12,100000012,'TI','David',NULL,'Vargas','Gómez','2011-07-30','Carrera 17 #12-34, Velez',3112346789,'david.vargas@gmail.com','M','Aliansalud','O-',NULL,NULL),(13,100000013,'TI','Alejandro','David','Ramírez',NULL,'2010-04-12','Calle 18 #23-45, Velez',3109874321,'alejandro.ramirez@gmail.com','M','Sanitas','A+',NULL,NULL),(14,100000014,'TI','Juan',NULL,'López',NULL,'2009-01-18','Carrera 20 #34-56, Velez',3123456789,'juan.lopez@gmail.com','M','Sura','O-',NULL,NULL),(15,100000015,'CC','Nicolás',NULL,'Torres','Díaz','2006-09-03','Calle 22 #45-67, Velez',3116789012,'nicolas.torres@gmail.com','M','Salud Bolívar','B-',NULL,NULL),(16,100000016,'CC','Sebastián','Felipe','Gómez',NULL,'2005-02-28','Carrera 24 #56-78, Velez',3105678901,'sebastian.gomez@gmail.com','M','Compensar','A+',NULL,NULL),(17,100000017,'CC','Juan',NULL,'Martínez','Pérez','2004-07-14','Calle 25 #67-89, Velez',3112345678,'juandavid.martinez@gmail.com','M','Sanitas','B+',NULL,NULL),(18,100000018,'CC','Daniel',NULL,'Pérez','Gómez','2003-11-02','Carrera 27 #12-34, Velez',3123456789,'daniel.perez@gmail.com','M','Aliansalud','O-',NULL,NULL),(19,100000019,'RC','Camila',NULL,'Rojas',NULL,'2022-04-22','Calle 28 #23-45, Velez',3116789012,'camila.rojas@gmail.com','F','Sura','O-',NULL,NULL),(20,100000020,'RC','Mateo','Andrés','Castillo','Morales','2021-08-30','Carrera 30 #34-56, Velez',3109871234,'mateo.castillo@gmail.com','M','Sanitas','B-',NULL,NULL),(21,100000021,'RC','Juan',NULL,'Ramírez','Torres','2020-11-10','Calle 32 #45-67, Velez',3102345678,'juan.ramirez@gmail.com','M','Compensar','A+',NULL,NULL),(22,100000022,'TI','Samuel','Alejandro','Gómez',NULL,'2019-02-20','Carrera 34 #12-34, Velez',3119876543,'samuel.gomez@gmail.com','M','Compensar','A+',NULL,NULL),(23,100000023,'TI','Nicolás',NULL,'López','Díaz','2018-10-12','Calle 36 #23-45, Velez',3105674321,'nicolas.lopez@gmail.com','M','Aliansalud','B+',NULL,NULL),(24,100000024,'TI','Isabella','Lucía','Morales',NULL,'2017-06-05','Carrera 38 #34-56, Velez',3112346789,'isabella.morales@gmail.com','F','Sura','B+',NULL,NULL),(25,100000025,'TI','Daniel',NULL,'Herrera','Díaz','2016-03-15','Calle 40 #45-67, Velez',3109871234,'daniel.herrera@gmail.com','M','Capital Salud','A+',NULL,NULL),(26,100000026,'TI','Santiago',NULL,'Díaz','Ramírez','2015-12-22','Carrera 42 #56-78, Velez',3123456789,'santiago.diaz@gmail.com','M','Sura','A-',NULL,NULL),(27,100000027,'TI','Mateo',NULL,'Castillo',NULL,'2014-05-30','Calle 44 #67-89, Velez',3105678901,'mateo.castillo@gmail.com','M','Capital Salud','A-',NULL,NULL),(28,100000028,'TI','Valentina','Sofía','Ramírez','Díaz','2013-01-18','Carrera 46 #12-34, Velez',3112345678,'valentina.ramirez@gmail.com','F','Sanitas','A+',NULL,NULL),(29,100000029,'TI','David',NULL,'López',NULL,'2012-08-07','Calle 48 #23-45, Velez',3109874321,'david.lopez@gmail.com','M','Salud Total','B+',NULL,NULL),(30,100000030,'TI','Alejandro','David','Morales','Ramírez','2011-04-12','Carrera 50 #34-56, Velez',3123456789,'alejandro.morales@gmail.com','M','Compensar','A+',NULL,NULL),(31,300000001,'CC','Carlos','Andrés','Muñoz','Torres','1992-04-15','Calle 2 #12-34, Velez',3101234567,'carlosandres.munoz@gmail.com','M','Sanitas','O+',NULL,1),(32,300000002,'CC','Lina','María','Ramírez','Pérez','1990-08-20','Carrera 5 #23-45, Velez',3123456789,'linamaria.ramirez@hotmail.com','F','Compensar','A+',NULL,NULL),(33,300000003,'CC','Sebastián','Alejandro','Gómez','Rojas','1985-11-30','Calle 8 #34-56, Velez',3105678901,'sebastianalejandro.gomez@gmail.com','M','Salud Total','A-',NULL,NULL),(34,300000004,'CC','Daniela','Valentina','Torres',NULL,'1994-03-12','Carrera 10 #45-67, Velez',3116789012,'danielavalentina.torres@gmail.com','F','Compensar','A+',NULL,2),(35,300000005,'CC','Juan','Felipe','Herrera','López','1991-07-25','Calle 12 #56-78, Velez',3109871234,'juanfelipe.herrera@gmail.com','M','Sanitas','B+',NULL,3),(36,300000006,'CC','Camila','Sofía','Hernadez','Castillo','1989-05-18','Carrera 15 #12-34, Velez',3112345678,'camilasofia.perez@gmail.com','F','Sanitas','A+',NULL,4),(37,300000007,'CC','Andrés','David','Martínez','Gómez','1993-10-05','Calle 18 #23-45, Velez',3105674321,'andresdavid.martinez@gmail.com','M','Salud Total','O+',NULL,NULL),(38,300000008,'CC','Mariana','Isabella','Díaz','Ramírez','1988-02-20','Carrera 20 #34-56, Velez',3113456789,'marianaisabella.diaz@gmail.com','F','Sanitas','B-',NULL,NULL),(39,300000009,'CC','Felipe','Santiago','Torres','Hernandez','1995-09-10','Calle 22 #45-67, Velez',3106789012,'felipesantiago.torres@gmail.com','M','Compensar','A+',NULL,5),(40,300000010,'CC','Laura','Valentina','Ramírez','Díaz','1992-06-03','Carrera 24 #56-78, Velez',3117890123,'lauravalentina.ramirez@gmail.com','F','Sanitas','B+',NULL,NULL),(41,1001001001,'CC','Mateo',NULL,'Pérez','López','1990-05-12','Calle 11 #23-15',3105551234,'mateo.perez@email.com','M','Sura','B-',NULL,6),(42,1001001005,'CC','Daniel',NULL,'Castro','Morales','1993-08-21','Transv 4A #33-55',3189991111,'daniel.castro@email.com','M','Salud Total','AB+',NULL,7),(43,1001001006,'CC','María','Camila','Torres','Salgado','1996-03-10','Calle 8A #19-22',3166667777,'maria.torres@email.com','F','Salud Total','A+',NULL,NULL),(44,1001001008,'CC','Tatiana',NULL,'Rincón','Arias','1992-12-05','Carrera 3 #9-09',3191234567,'tatiana.rincon@email.com','F','Sura','B-',NULL,8),(45,1001001009,'CC','Julian',NULL,'Martín','Suárez','1985-04-01','Calle 19 #7-11',3170001112,'julian.martin@email.com','M','Compensar','A-',NULL,NULL),(46,1031133469,'CC','Martín','Andrés','Acevedo',NULL,'1991-08-09','trvs 45 re 45 34',3242499701,'tin@live.com.ar','M','Sanitas','A+',NULL,NULL),(47,1028662497,'CC','Nicol',NULL,'Martínez',NULL,'2005-12-01','call 34 re 4534  sdsf',3224456372,'nicol@gm.com','F','Compensar','B+',NULL,NULL),(48,1035544987,'CC','Marcos','Jaime','Vargas','Rojas','2001-06-06','calle siempre viva 123',3245879564,'marcos@gm.com','M','Aliansalud','A+',NULL,9),(49,1034455984,'CC','Jaime',NULL,'Vanegas',NULL,'2002-07-10','calle 55 #56-3',3284645346,'jaime@gm.com','M','Capital Salud','A-',NULL,10),(50,1002546756,'CC','Lionel','Andrés','Messi','Cuccittini','1986-06-26','calle 24 #4-3',3254544654,'messi@gm.com','M','Capital Salud','A-',NULL,NULL),(51,1019118564,'CC','Luis','Alejandro','Acevedo','Acevedo','1996-04-22','avenida caracas 45',3209964504,'ale@gmail.com','M','Compensar','O+',NULL,NULL),(52,1001002002,'CC','Román','Andrés','Riquelme',NULL,'1979-08-06','trvs 56 #6',3254686994,'roman@gmail.com','M','Sanitas','A+',NULL,NULL),(53,1034952215,'CC','Rogers',NULL,'Ramírez',NULL,'1966-03-15','calle 65 con 45 sur ',3452532718,'rogers@gmail.com','M','Compensar','AB+',NULL,NULL),(54,1077777777,'CC','Nicol',NULL,'Martínez',NULL,'1991-08-10','calle 45 d sur',3248794568,'nicolmartinezforero12@gmail.com','F','Compensar','A+',NULL,NULL);
/*!40000 ALTER TABLE `persona` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_jornada_categoria`
--

DROP TABLE IF EXISTS `personal_jornada_categoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_jornada_categoria` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `fk_categoria` int NOT NULL,
  `fk_jornada` int NOT NULL,
  `fk_personal` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_jornada_categor_fk_personal_fk_jornada_f_9e444021_uniq` (`fk_personal`,`fk_jornada`,`fk_categoria`),
  KEY `personal_jornada_cat_fk_categoria_eed4acbe_fk_categoria` (`fk_categoria`),
  KEY `personal_jornada_cat_fk_jornada_2ff7b306_fk_jornada_e` (`fk_jornada`),
  CONSTRAINT `personal_jornada_cat_fk_categoria_eed4acbe_fk_categoria` FOREIGN KEY (`fk_categoria`) REFERENCES `categoria` (`idcategoria`),
  CONSTRAINT `personal_jornada_cat_fk_jornada_2ff7b306_fk_jornada_e` FOREIGN KEY (`fk_jornada`) REFERENCES `jornada_entrenamientos` (`idjornada`),
  CONSTRAINT `personal_jornada_cat_fk_personal_c5dced7f_fk_personal_` FOREIGN KEY (`fk_personal`) REFERENCES `personal_t` (`fk_persona`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_jornada_categoria`
--

LOCK TABLES `personal_jornada_categoria` WRITE;
/*!40000 ALTER TABLE `personal_jornada_categoria` DISABLE KEYS */;
INSERT INTO `personal_jornada_categoria` VALUES (2,4,2,32),(3,4,3,32),(7,2,1,36),(8,5,3,36),(9,5,2,37),(10,5,3,37),(11,4,2,42),(12,4,3,42),(1,1,1,46),(4,1,1,47),(5,3,1,48),(6,3,1,49);
/*!40000 ALTER TABLE `personal_jornada_categoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_t`
--

DROP TABLE IF EXISTS `personal_t`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_t` (
  `fk_persona` int NOT NULL,
  `contrasena` varchar(64) NOT NULL,
  `tipo_personal` varchar(13) NOT NULL,
  `postulante` tinyint(1) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT NULL,
  `experiencia` int NOT NULL,
  `descripcion_especialidad` longtext,
  `hoja_vida` varchar(100) DEFAULT NULL,
  `tarjeta_profesional` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`fk_persona`),
  CONSTRAINT `personal_t_fk_persona_1b04c725_fk_persona_id` FOREIGN KEY (`fk_persona`) REFERENCES `persona` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_t`
--

LOCK TABLES `personal_t` WRITE;
/*!40000 ALTER TABLE `personal_t` DISABLE KEYS */;
INSERT INTO `personal_t` VALUES (31,'carlos123','Administrador',0,1,7,'Administración deportiva','',''),(32,'juan123','Entrenador',0,0,3,'Entrenamiento en fundamentos de fútbol',NULL,NULL),(33,'pedro123','Entrenador',1,0,2,'Preparación física en fútbol',NULL,NULL),(34,'ana123','Administrador',0,1,5,'Administración deportiva','',''),(35,'laura123','Administrador',0,1,6,'Administración deportiva','',''),(36,'marcos123','Entrenador',0,1,4,'Táctica y estrategia en fútbol','',''),(37,'david123','Entrenador',0,0,1,'Entrenamiento de arqueros',NULL,NULL),(38,'sofia123','Entrenador',1,0,3,'Formación técnica futbol infantil',NULL,NULL),(39,'manuel123','Administrador',0,1,8,'Administración deportiva','',''),(40,'teresa123','Entrenador',1,0,5,'Entrenamiento ofensivo',NULL,NULL),(41,'mateo123','Administrador',0,1,6,'Administración deportiva','',''),(42,'daniel123','Entrenador',0,1,3,'Entrenamiento en fundamentos de fútbol','',''),(43,'maria123','Entrenador',0,0,2,'Preparación física en fútbol',NULL,NULL),(44,'tatiana123','Entrenador',0,1,5,'Táctica y estrategia en fútbol','',''),(45,'julian123','Administrador',0,0,8,'Administración deportiva',NULL,NULL),(46,'martin123','Entrenador',1,0,4,'Entrenamiento de arqueros',NULL,NULL),(47,'nicol123','Entrenador',1,0,1,'Formación técnica futbol infantil',NULL,NULL),(48,'marcos123','Entrenador',0,1,7,'Entrenamiento ofensivo','',''),(49,'jaime123','Entrenador',0,1,3,'Entrenamiento en fundamentos de fútbol','',''),(50,'lionel123','Entrenador',1,0,8,'Preparación física en fútbol',NULL,NULL),(51,'luis123','Administrador',0,0,5,'Administración deportiva',NULL,NULL),(52,'roman123','Entrenador',0,0,6,'Táctica y estrategia en fútbol',NULL,NULL),(53,'rogers123','Administrador',0,0,10,'Administración deportiva',NULL,NULL),(54,'nicol123','Entrenador',0,0,4,'Entrenamiento ofensivo',NULL,NULL);
/*!40000 ALTER TABLE `personal_t` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_t_habilidad`
--

DROP TABLE IF EXISTS `personal_t_habilidad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_t_habilidad` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `fk_habilidad` int NOT NULL,
  `fk_personal` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_t_habilidad_fk_personal_fk_habilidad_169ef5d5_uniq` (`fk_personal`,`fk_habilidad`),
  KEY `personal_t_habilidad_fk_habilidad_0ca8ba06_fk_habilidad` (`fk_habilidad`),
  CONSTRAINT `personal_t_habilidad_fk_habilidad_0ca8ba06_fk_habilidad` FOREIGN KEY (`fk_habilidad`) REFERENCES `habilidad` (`idhabilidad`),
  CONSTRAINT `personal_t_habilidad_fk_personal_1724fdb1_fk_personal_` FOREIGN KEY (`fk_personal`) REFERENCES `personal_t` (`fk_persona`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_t_habilidad`
--

LOCK TABLES `personal_t_habilidad` WRITE;
/*!40000 ALTER TABLE `personal_t_habilidad` DISABLE KEYS */;
/*!40000 ALTER TABLE `personal_t_habilidad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posicion`
--

DROP TABLE IF EXISTS `posicion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posicion` (
  `idposicion` int NOT NULL AUTO_INCREMENT,
  `nom_posicion` varchar(5) NOT NULL,
  `desc_posicion` varchar(30) NOT NULL,
  PRIMARY KEY (`idposicion`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posicion`
--

LOCK TABLES `posicion` WRITE;
/*!40000 ALTER TABLE `posicion` DISABLE KEYS */;
INSERT INTO `posicion` VALUES (1,'1-POR','portero'),(2,'1-DEF','defensor central'),(3,'2-DEF','defensor lateral'),(4,'1-CEN','centrocampista defensivo'),(5,'2-CEN','centrocampista Ofencivo'),(6,'1-DEL','delantero central'),(7,'2-DEL','delantero extremo');
/*!40000 ALTER TABLE `posicion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sesionentrenamiento`
--

DROP TABLE IF EXISTS `sesionentrenamiento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sesionentrenamiento` (
  `idsesion` int NOT NULL AUTO_INCREMENT,
  `fecha_entrenamiento` datetime(6) NOT NULL,
  `fk_entrenamiento` int NOT NULL,
  PRIMARY KEY (`idsesion`),
  KEY `sesionentrenamiento_fk_entrenamiento_a3cf9dd8_fk_entrenami` (`fk_entrenamiento`),
  CONSTRAINT `sesionentrenamiento_fk_entrenamiento_a3cf9dd8_fk_entrenami` FOREIGN KEY (`fk_entrenamiento`) REFERENCES `entrenamiento` (`identrenamiento`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sesionentrenamiento`
--

LOCK TABLES `sesionentrenamiento` WRITE;
/*!40000 ALTER TABLE `sesionentrenamiento` DISABLE KEYS */;
INSERT INTO `sesionentrenamiento` VALUES (1,'2025-02-02 00:00:00.000000',3),(2,'2025-02-02 00:00:00.000000',6),(3,'2025-02-02 00:00:00.000000',8),(4,'2025-02-02 00:00:00.000000',13),(5,'2025-02-02 00:00:00.000000',16);
/*!40000 ALTER TABLE `sesionentrenamiento` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-19  5:57:52
