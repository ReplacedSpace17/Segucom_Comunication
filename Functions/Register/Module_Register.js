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

// Función para actualizar el perfil de un usuario
async function addUserPersonal(req, res, data) {
    const telefono = data.Telefono;

    // Consulta para verificar si el número de teléfono existe en la tabla PERFIL_ELEMENTO
    const checkPhoneQuery = 'SELECT * FROM PERFIL_ELEMENTO WHERE ELEMENTO_TELNUMERO = ? AND PERFIL_CLAVE IS NULL';


    // Consulta para actualizar los campos en la tabla PERFIL_ELEMENTO
    const updateProfileQuery = `
        UPDATE PERFIL_ELEMENTO
        SET 
            PERFIL_NOMBRE = ?, 
            PERFIL_CLAVE = ?, 
            PERFIL_ANDROID = ?, 
            ELEMENTO_NUMERO = ?
        WHERE ELEMENTO_TELNUMERO = ?`;

    // Ejecutar la consulta de verificación
    connection.query(checkPhoneQuery, [telefono], (checkError, results) => {
        if (checkError) {
            console.error('Error al verificar el número de teléfono', checkError);
            return res.status(500).json({ error: 'Error de servidor al verificar el número de teléfono' });
        }

        // Si el número de teléfono existe, proceder con la actualización
        if (results.length > 0) {
            connection.query(updateProfileQuery, [
                data.Nombre,      // PERFIL_NOMBRE
                data.Clave,       // PERFIL_CLAVE
                data.IMEI,        // PERFIL_ANDROID
                data.No_Empleado, // ELEMENTO_NUMERO
                telefono          // ELEMENTO_TELNUMERO
            ], (updateError, updateResults) => {
                if (updateError) {
                    console.error('Error al actualizar el perfil', updateError);
                    return res.status(500).json({ error: 'Error de servidor al actualizar el perfil' });
                }

                console.log('Perfil actualizado correctamente para el número de teléfono: ' + telefono);
                res.status(200).json({ message: 'Perfil actualizado correctamente', Nombre: data.Nombre });
            });
        } else {
            // Si el número de teléfono no existe, enviar una respuesta de error
            console.log('El número de teléfono no existe en la tabla PERFIL_ELEMENTO');
            res.status(404).json({ error: 'Número de teléfono no encontrado' });
        }
    });
}
// Función para realizar el inicio de sesión
async function loginUser(req, res, telefono, clave) {
    const loginScript = 'SELECT * FROM PERFIL_ELEMENTO WHERE ELEMENTO_TELNUMERO = ? AND PERFIL_CLAVE = ?';
    
    // Ejecutar la consulta para buscar el usuario por número de teléfono y clave
    connection.query(loginScript, [telefono, clave], (error, results) => {
        if (error) {
            console.error('Error al realizar el inicio de sesión', error);
            return res.status(500).json({ error: 'Error de servidor al realizar el inicio de sesión' });
        }
        
        // Verificar si se encontró un usuario con las credenciales proporcionadas
        if (results.length === 1) {
            console.log('Inicio de sesión exitoso del usuario:', results[0]);
            // Devolver el nombre junto con el resto de los datos del usuario
            res.status(200).json(results[0]);
        } else {
            console.log('Credenciales inválidas');
            res.status(401).json({ error: 'Credenciales inválidas' });
        }
    });
}



module.exports = {
    addUserPersonal,loginUser
};
