-- Crear la base de datos SegucomDB
CREATE DATABASE SegucomDB;

-- Usar la base de datos SegucomDB
USE SegucomDB;

-- Crear la tabla "Personal"
CREATE TABLE Personal (
  PersonalID VARCHAR(50) PRIMARY KEY,
  No_Empleado INT NOT NULL,
  Nombre VARCHAR(100) NOT NULL,
  Telefono VARCHAR(10),
  IMEI VARCHAR(25),
  Clave VARCHAR(50) NOT NULL
);

-- Crear la tabla "Ubicaciones"
CREATE TABLE Ubicaciones (
  Ubicacion_ID VARCHAR(50) PRIMARY KEY,
  PersonalID VARCHAR(50),
  Latitud VARCHAR(50),
  Longitud VARCHAR(50),
  Hora TIME NOT NULL,
  Fecha DATE NOT NULL,
  FOREIGN KEY (PersonalID) REFERENCES Personal(PersonalID)
);

-- TABLAR DE REFERENCIA
-- Crear la tabla "usuarios_permitidos"

-- Crear la tabla "regiones"

-- Crear la tabla "puntos_vigilancia"

-- Crear el usuario API_User con una contraseña
CREATE USER 'API_User'@'%' IDENTIFIED BY 'VJQy9lCOUWsB3wZ';

-- Conceder todos los privilegios en la base de datos SegucomDB a API_User
GRANT ALL PRIVILEGES ON SegucomDB.* TO 'API_User'@'%';

-- Aplicar los cambios
FLUSH PRIVILEGES;
