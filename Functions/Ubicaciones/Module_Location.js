const connection = require('../../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');

function generarID() {
  return uuidv4();
}

/*
{
    "PersonalID": "947e033a-52c1-4fbe-a8d9-50834dae81ba",
    "Latitud": "19.432608",
    "Longitud": "-99.133209",
    "Hora": "14:30:00",
    "Fecha": "2024-05-19"
}

{
  PersonalID: '947e033a-52c1-4fbe-a8d9-50834dae81ba',
  Latitud: '37.4220936',
  Longitud: '-122.083922',
  Hora: '03:09:22',
  Fecha: '2024-05-25'
}

Tabla:
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

*/
// Función para agregar una nueva ubicación
async function addUbicacion(req, res, data) {
    const Ubicacion_ID = generarID(); // Generar un nuevo ID para la ubicación
    const addUbicacionScript = 'INSERT INTO Ubicaciones (Ubicacion_ID, PersonalID, Latitud, Longitud, Hora, Fecha) VALUES ($1, $2, $3, $4, $5, $6)';
    try {
        // Ejecutar la consulta para agregar la ubicación a la tabla "Ubicaciones"
        await connection.query(addUbicacionScript, 
            [
                Ubicacion_ID,
                data.PersonalID,
                data.Latitud,
                data.Longitud,
                data.Hora,
                data.Fecha
            ]);
        console.log('Nueva ubicación agregada por: ' + data.PersonalID + ' en ' + data.Fecha + ' a las ' + data.Hora + ' en la latitud ' + data.Latitud + ' y longitud ' + data.Longitud );
        res.status(200).json({ message: 'Ubicación agregada correctamente', Ubicacion_ID: Ubicacion_ID });
    } catch (error) {
        console.error('Error al agregar la ubicación', error);
        res.status(500).json({ error: 'Error de servidor al agregar la ubicación' });
    }
}

// Función para obtener todas las ubicaciones
async function getUbicaciones(req, res) {
    const getUbicacionesScript = 'SELECT * FROM Ubicaciones';
    try {
        // Ejecutar la consulta para obtener todas las ubicaciones
        const { rows } = await connection.query(getUbicacionesScript);
        console.log('Ubicaciones obtenidas correctamente');
        res.status(200).json({ message: 'Ubicaciones obtenidas correctamente', ubicaciones: rows });
    } catch (error) {
        console.error('Error al obtener las ubicaciones', error);
        res.status(500).json({ error: 'Error de servidor al obtener las ubicaciones' });
    }
}

async function getUbicacionesByID(req, res, id) {

    const getUbicacionesScript = 'SELECT * FROM Ubicaciones WHERE PersonalID = $1';
    try {
        // Ejecutar la consulta para obtener todas las ubicaciones del usuario
        const { rows } = await connection.query(getUbicacionesScript, [id]);
        console.log(`Ubicaciones obtenidas correctamente para el usuario ${id}`);
        res.status(200).json({ message: 'Ubicaciones obtenidas correctamente', ubicaciones: rows });
    } catch (error) {
        console.error('Error al obtener las ubicaciones', error);
        res.status(500).json({ error: 'Error de servidor al obtener las ubicaciones' });
    }
}
module.exports = {
    addUbicacion,
    getUbicaciones,
    getUbicacionesByID
};


