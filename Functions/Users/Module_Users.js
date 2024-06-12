const { db_segucom } = require('../../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');

function generarID() {
    return uuidv4();
}

// Función para realizar el inicio de sesión
async function getUsersAvailables(req, res) {
    const script = `
        SELECT 
            pe.PERFIL_ID, 
            pe.PERFIL_NOMBRE, 
            pe.PERFIL_CLAVE, 
            pe.PERFIL_ANDROID, 
            pe.ELEMENTO_NUMERO, 
            pe.ELEMENTO_TELNUMERO,
            e.ELEMENTO_NOMBRE,
            e.ELEMENTO_PATERNO,
            e.ELEMENTO_MATERNO
        FROM 
            PERFIL_ELEMENTO pe
        LEFT JOIN 
            ELEMENTO e 
        ON 
            pe.ELEMENTO_TELNUMERO = e.ELEMENTO_TELNUMERO
        WHERE 
            pe.PERFIL_CLAVE IS NOT NULL;
    `;


    try {
        const [results] = await db_segucom.promise().query(script);

        if (results.length > 0) {
            console.log('data:', results);
            res.status(200).json(results);
            console.log('Mostrando usuarios disponibles:', results[0]);
        } else {
            console.log('No se encontraron usuarios');
            res.status(401).json({ error: 'No se encontraron usuarios' });
        }
    } catch (error) {
        console.error('Error al realizar la consulta', error);
        res.status(500).json({ error: 'Error de servidor al realizar la consulta' });
    }
}

module.exports = {
   getUsersAvailables
};
