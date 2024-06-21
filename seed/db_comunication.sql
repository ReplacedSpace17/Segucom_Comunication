CREATE DATABASE segucomm_comunication;
use segucomm_comunication;

-- Crear la tabla CATALOGO_GRUPOS
CREATE TABLE CATALOGO_GRUPOS (
  MSGRUPO_ID INT PRIMARY KEY AUTO_INCREMENT,
  MSGRUPO_FEC DATE NOT NULL,
  MSGRUPO_CVE VARCHAR(7) NOT NULL UNIQUE,
  MSGRUPO_NOMBRE VARCHAR(20) NOT NULL,
  MSGRUPO_ESTATUS INT NOT NULL,
  MSGRUPO_ADMON INT NOT NULL,
  REGION_ID INT NOT NULL,
  DIVISION_ID INT NOT NULL
 
);

-- Crear la tabla CATALOGO_ELEMENTOGRUPO
CREATE TABLE CATALOGO_ELEMENTOGRUPO (
  MSELEGRU_ID INT PRIMARY KEY AUTO_INCREMENT,
  MSELEGRU_FEC DATE NOT NULL,
  MSGRUPO_ID INT NOT NULL,
  ELEMENTO_ID INT NOT NULL,
  ELEMENTO_NUMERO INT NOT NULL,
  MSELEGRU_NOMBRE VARCHAR(50) NOT NULL,
  MSELEGRU_TELEFONO BIGINT NOT NULL,
  MSELEGRU_ESTATUS INT NOT NULL
);

-- Crear la tabla MENSAJE_ELEMENTO
CREATE TABLE MENSAJE_ELEMENTO (
  MENELEM_ID INT PRIMARY KEY AUTO_INCREMENT,
  MENELEM_FEC DATETIME NOT NULL,
  ELEMENTO_SEND INT NOT NULL,
  ELEMENTO_RECIBE INT NOT NULL,
  MENELEM_TEXTO VARCHAR(150) NOT NULL,
  MENELEM_MEDIA VARCHAR(11) NOT NULL
);

-- Crear la tabla MENSAJE_GRUPO
CREATE TABLE MENSAJE_GRUPO (
  MENGPO_ID INT PRIMARY KEY AUTO_INCREMENT,
  MENGPO_FEC DATETIME NOT NULL,
  MSGRUPO_ID INT NOT NULL,
  ELEMENTO_SEND INT NOT NULL,
  MENGPO_TEXTO VARCHAR(150) NOT NULL,
  MENGPO_MEDIA VARCHAR(11) NOT NULL,
  MENGPO_ESTATUS VARCHAR(1) NOT NULL
);

CREATE USER 'API_User'@'%' IDENTIFIED BY 'VJQy9lCOUWsB3wZ';

-- Conceder todos los privilegios en la base de datos SegucomDB a API_User
GRANT ALL PRIVILEGES ON segucomm_comuniation.* TO 'API_User'@'%';

-- Aplicar los cambios
FLUSH PRIVILEGES;