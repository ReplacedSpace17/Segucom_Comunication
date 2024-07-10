CREATE DATABASE segucomm_mms;
use segucomm_mms;

-- Crear la tabla CATALOGO_GRUPOS

-- Crear la tabla MENSAJE_ELEMENTO
CREATE TABLE MENSAJE_ELEMENTO (
  MENELEM_ID INT PRIMARY KEY AUTO_INCREMENT,
  MENELEM_FEC DATETIME NOT NULL,
  ELEMENTO_SEND INT NOT NULL,
  ELEMENTO_RECIBE INT NOT NULL,
  MENELEM_TEXTO VARCHAR(150) NOT NULL,
  MENELEM_MEDIA VARCHAR(11) NOT NULL,
  MENELEM_UBICACION VARCHAR(50) NOT NULL
);

CREATE TABLE GRUPO_ELEMENTOS (
  ELEMGPO_ID int(11) NOT NULL AUTO_INCREMENT,
  ELEMGPO_FEC date NOT NULL,
  ELEMGPO_ESTATUS int(11) DEFAULT NULL,
  GRUPO_ID int(11) DEFAULT NULL,
  ELEMENTO_ID int(11) DEFAULT NULL,
  ELEMENTO_NUMERO int(11) DEFAULT NULL,
  ELEMENTO_TELNUMERO bigint(20) DEFAULT NULL,
  PRIMARY KEY (ELEMGPO_ID)
) ENGINE = InnoDB AUTO_INCREMENT = 8 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE GRUPO_MMS (
  GRUPO_ID int(11) NOT NULL AUTO_INCREMENT,
  GRUPO_FEC date NOT NULL,
  GRUPO_CLAVE varchar(10) DEFAULT NULL,
  GRUPO_DESCRIP varchar(50) DEFAULT NULL,
  GRUPO_ESTATUS int(11) DEFAULT NULL,
  REGION_ID int(11) DEFAULT NULL,
  DIVISION_ID int(11) DEFAULT NULL,
  ELEMENTO_NUMERO int(11) DEFAULT NULL,
  PRIMARY KEY (GRUPO_ID)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE MENSAJE_GRUPO (
  MMS_ID int(11) NOT NULL AUTO_INCREMENT,
  MMS_FEC datetime NOT NULL,
  MMS_TXT longtext DEFAULT NULL,
  MMS_IMG varchar(10) DEFAULT NULL,
  MMS_OK varchar(2) DEFAULT NULL,
  MMS_MEDIA varchar(11) NOT NULL,
  MMS_UBICACION varchar(50) NOT NULL,
  ELEMENTO_NUMERO int(11) DEFAULT NULL,
  GRUPO_ID int(11) DEFAULT NULL,
  PRIMARY KEY (MMS_ID)
) ENGINE = InnoDB AUTO_INCREMENT = 8 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;


-- Insertar datos en la tabla GRUPO_ELEMENTOS
INSERT INTO GRUPO_ELEMENTOS (ELEMENTO_ID, ELEMENTO_NUMERO, ELEMENTO_TELNUMERO, ELEMGPO_ESTATUS, ELEMGPO_FEC, ELEMGPO_ID, GRUPO_ID)
VALUES 
    (25, 22, NULL, 0, '2024-06-18', 1, 1), 
    (145, 1423, NULL, 1, '2024-06-18', 4, 1), 
    (526, 3647, NULL, 1, '2024-06-18', 5, 1), 
    (457, 54, NULL, 1, '2024-06-18', 6, 1), 
    (3647, 80000, NULL, 1, '2024-06-19', 7, 1);

-- Insertar datos en la tabla GRUPO_MMS
INSERT INTO GRUPO_MMS (DIVISION_ID, ELEMENTO_NUMERO, GRUPO_CLAVE, GRUPO_DESCRIP, GRUPO_ESTATUS, GRUPO_FEC, GRUPO_ID, REGION_ID)
VALUES 
    (31, 80000, 'GPOEJEM1', 'GRUPO DE COMUNICACION 1', 1, '2024-06-18', 1, 5), 
    (70, 80000, 'GPOEJEM2', 'GRUPO DE COMUNICACION DOS', 0, '2024-06-18', 2, 6);

-- Insertar datos en la tabla MENSAJE_GRUPO
INSERT INTO MENSAJE_GRUPO (ELEMENTO_NUMERO, GRUPO_ID, MMS_FEC, MMS_ID, MMS_IMG, MMS_MEDIA, MMS_OK, MMS_TXT, MMS_UBICACION)
VALUES 
    (80000, 1, '2024-06-20 03:03:37', 1, NULL, '', NULL, 'Buenos días, GRUPO. Necesito discutir los detalles del nuevo proceso de presentación que estamos implementando.', ''), 
    (80100, 1, '2024-06-20 03:03:37', 2, NULL, '', NULL, 'Por supuesto, estoy disponible ahora. ¿Prefieres vernos o prefieres una llamada rápida?', ''), 
    (80000, 1, '2024-06-20 03:03:37', 3, NULL, '', NULL, 'Preferiría una reunión rápida con todo el grupo para poder compartir la pantalla y mostrarte los cambios.', ''), 
    (80100, 1, '2024-06-20 03:03:37', 4, NULL, '', NULL, 'Perfecto, en la próxima reunión unos 10 minutos antes estaré listo. Vamos a revisar los ajustes y cómo afectan a los tiempos de entrega de información que nos está deteniendo un poco por la tarde.', ''), 
    (80000, NULL, '2024-06-20 03:03:37', 5, NULL, '', NULL, 'De acuerdo, voy a tener listos los datos de los últimos ciclos de revisión para comparar, tenemos un porcentaje alto con respecto al del mes pasado... Es por eso que requiero la reunión con el equipo y pido por favor que traigan sus reportes para poder analizarlos.', ''), 
    (80000, NULL, '2024-06-20 03:03:37', 6, NULL, '', NULL, 'Es importante. Vamos a incluir eso en nuestra reunión sobre la capacitación adicional necesaria, principalmente a los elementos que tengan un ingreso de menos de 3 meses y que estuvieron presentes en la revisión pasada.', '');


CREATE USER 'API_User'@'%' IDENTIFIED BY 'VJQy9lCOUWsB3wZ';

-- Conceder todos los privilegios en la base de datos SegucomDB a API_User
GRANT ALL PRIVILEGES ON segucomm_mms.* TO 'API_User'@'%';

-- Aplicar los cambios
FLUSH PRIVILEGES;