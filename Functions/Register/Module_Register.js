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

// Función para agregar un nuevo registro en la tabla Personal
async function addUserPersonal(req, res, data) {
    const PersonalID = generarID(); // Generar un nuevo ID para el personal
    const addCepaScript = 'INSERT INTO Personal (PersonalID, No_Empleado, Nombre, Telefono, IMEI, Clave) VALUES ($1, $2, $3, $4, $5, $6)';
    try {
        // Ejecutar la consulta para agregar el registro a la tabla Personal
        await connection.query(addCepaScript, 
            [   
                PersonalID, 
                data.No_Empleado, 
                data.Nombre, 
                data.Telefono, 
                data.IMEI, 
                data.Clave
            ]);
        console.log('Nuevo registro agregado correctamente');
        res.status(201).json({ message: 'Personal agregado correctamente', Nombre: data.Nombre });
    } catch (error) {
        console.error('Error al agregar el registro', error);
        res.status(500).json({ error: 'Error de servidor al agregar el personal' });
    }
}

module.exports = {
    addUserPersonal
};
