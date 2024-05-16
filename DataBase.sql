CREATE DATABASE FESPE;

-- Crear la tabla "users"
CREATE TABLE Personal (
  PersonalID VARCHAR PRIMARY KEY,
  No_Empleado INT,
  Nombre VARCHAR,
  Telefono VARCHAR,
  IMEI VARCHAR,
  Clave VARCHAR
);

CREATE TABLE Ubicaciones (
  Ubicacion_ID VARCHAR PRIMARY KEY,
  PersonalID VARCHAR,
  Latitud VARCHAR,
  Longitud VARCHAR,
  Hora time,
  Fecha date
);

