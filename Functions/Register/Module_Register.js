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
        res.status(200).json({ message: 'Personal agregado correctamente', Nombre: data.Nombre });
    } catch (error) {
        console.error('Error al agregar el registro', error);
        res.status(500).json({ error: 'Error de servidor al agregar el personal' });
    }
}

// Función para realizar el inicio de sesión
async function loginUser(req, res, telefono, clave) {
    const loginScript = 'SELECT * FROM Personal WHERE Telefono = $1 AND Clave = $2';
    try {
        // Ejecutar la consulta para buscar el usuario por número de teléfono y clave
        const { rows } = await connection.query(loginScript, [telefono, clave]);
        
        // Verificar si se encontró un usuario con las credenciales proporcionadas
        if (rows.length === 1) {
            console.log('Inicio de sesión exitoso del usuario:', rows[0].nombre);
            // Devolver el nombre junto con el resto de los datos del usuario
            res.status(200).json({ message: 'Inicio de sesión exitoso', usuario: rows[0] });
        } else {
            console.log('Credenciales inválidas');
            res.status(401).json({ error: 'Credenciales inválidas' });
        }
    } catch (error) {
        console.error('Error al realizar el inicio de sesión', error);
        res.status(500).json({ error: 'Error de servidor al realizar el inicio de sesión' });
    }
}



module.exports = {
    addUserPersonal,loginUser
};
