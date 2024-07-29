const { db_segucom } = require('../../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');

function generarID() {
    return uuidv4();
}

// Función para realizar el inicio de sesión
async function getUsersAvailables(req, res, numero) {
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
            pe.PERFIL_CLAVE IS NOT NULL
            AND pe.ELEMENTO_TELNUMERO != ?
            AND pe.ELEMENTO_NUMERO != ?;  -- Excluir el número específico
    `;

    try {
        const [results] = await db_segucom.promise().query(script, [numero, numero]); // Pasar el número dos veces para la consulta

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



//AGREGAR ALERTA DE BOTON DE PANICO
async function AddAlertaPanico(req, res, data) {
    const insertAlarmaQuery = `
        INSERT INTO ALARMA_ELEMENTO 
        (ALARMA_FEC, ELEMENTO_NUMERO, ELEMENTO_TEL_NUMERO, ALARMA_UBICA, ALARMA_ACTIVA) 
        VALUES (?, ?, ?, ?, ?);
    `;

    const values = [
        data.ALARMA_FEC,
        data.ELEMENTO_NUMERO,
        data.ELEMENTO_TEL_NUMERO,
        data.ALARMA_UBICA,
        1
    ];

    db_segucom.query(insertAlarmaQuery, values, (error, results) => {
        if (error) {
            console.error('Error al insertar la alarma de pánico', error);
            return res.status(500).json({ error: 'Error de servidor al insertar la alarma de pánico' });
        }

        res.status(201).json({ message: 'Alarma de pánico insertada exitosamente', id: results.insertId });
    });
}

module.exports = {
   getUsersAvailables, AddAlertaPanico
};
