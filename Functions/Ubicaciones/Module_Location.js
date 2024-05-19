const connection = require('../../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');

function generarID() {
  return uuidv4();
}

/*
{
    "No_Empleado": 12345,
    "Nombre": "Juan Pérez",
    "Telefono": "5551234567",
    "IMEI": "123456789012345",
    "Clave": "password123"
}

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
        res.status(201).json({ message: 'Ubicación agregada correctamente', Ubicacion_ID: Ubicacion_ID });
    } catch (error) {
        console.error('Error al agregar la ubicación', error);
        res.status(500).json({ error: 'Error de servidor al agregar la ubicación' });
    }
}

module.exports = {
    addUbicacion
};
