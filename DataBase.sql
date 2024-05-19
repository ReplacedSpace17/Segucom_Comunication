CREATE DATABASE SegucomDB;

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
  CONSTRAINT fk_personal
    FOREIGN KEY (PersonalID) REFERENCES Personal(PersonalID)
);


-- Crear el usuario API_User con una contraseña generada
CREATE USER API_User WITH PASSWORD 'VJQy9lCOUWsB3wZ';
-- Conceder todos los privilegios en la base de datos SegucomDB a API_User
GRANT ALL PRIVILEGES ON DATABASE SegucomDB TO API_User;
-- Conceder permisos de todos los privilegios en todas las tablas del esquema público
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO API_User;
-- Conceder permisos de secuencia
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO API_User;
-- Conceder permisos en los objetos futuros creados en el esquema público
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO API_User;