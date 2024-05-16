const connection = require('../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');

function generarID() {
  return uuidv4();
}

// Función para agregar una nueva cepa
async function addCepa(req, res, data) {
    const cepa_id = generarID(); // Generar un nuevo ID para la cepa
    const { user_id, nombre, origen, medio } = data; // Obtener los datos de la cepa desde la solicitud
    const addCepaScript = 'INSERT INTO cepas (id, user_id, nombre, origen, medio) VALUES ($1, $2, $3, $4, $5)';
    
    try {
        // Ejecutar la consulta para agregar la cepa a la tabla "cepas"
        await connection.query(addCepaScript, [cepa_id, user_id, nombre, origen, medio]);
        console.log('Cepa agregada correctamente');
        res.status(201).json({ message: 'Cepa agregada correctamente', cepa_id: cepa_id });
    } catch (error) {
        console.error('Error al agregar la cepa', error);
        res.status(500).json({ error: 'Error de servidor al agregar la cepa' });
    }
}

// Función para editar una cepa existente
async function editCepa(req, res, data, id) {
    const { nombre, origen, medio } = data; // Obtener los nuevos datos de la cepa desde la solicitud
    const editCepaScript = 'UPDATE cepas SET nombre = $1, origen = $2, medio = $3 WHERE id = $4';
    
    try {
        // Ejecutar la consulta para editar la cepa en la tabla "cepas"
        await connection.query(editCepaScript, [nombre, origen, medio, id]);
        console.log('Cepa editada correctamente');
        res.status(200).json({ message: 'Cepa editada correctamente', cepa_id: id });
    } catch (error) {
        console.error('Error al editar la cepa', error);
        res.status(500).json({ error: 'Error de servidor al editar la cepa' });
    }
}

// Función para eliminar una cepa existente
async function deleteCepa(req, res, cepa_id) {
    const deleteCepaScript = 'DELETE FROM cepas WHERE id = $1';
    
    try {
        // Ejecutar la consulta para eliminar la cepa de la tabla "cepas"
        await connection.query(deleteCepaScript, [cepa_id]);
        res.status(200).json({ message: 'Cepa eliminada correctamente', cepa_id: cepa_id });
    } catch (error) {
        console.error('Error al eliminar la cepa', error);
        res.status(500).json({ error: 'Error de servidor al eliminar la cepa' });
    }
}

// Función para obtener información de una cepa
async function getCepa(req, res, cepa_id) {
    const getCepaScript = 'SELECT * FROM cepas WHERE id = $1';
    
    try {
        // Ejecutar la consulta para obtener información de la cepa de la tabla "cepas"
        const result = await connection.query(getCepaScript, [cepa_id]);
        if (result.rows.length > 0) {
            //
            res.status(200).json(result.rows[0]); // Devolver la información de la cepa encontrada
        } else {
            res.status(404).json({ error: 'Cepa no encontrada' });
        }
    } catch (error) {
        console.error('Error al obtener información de la cepa', error);
        res.status(500).json({ error: 'Error de servidor al obtener información de la cepa' });
    }
}

// Función para obtener todas las cepas
async function getAllCepas(req, res, user_id) {
    const getAllCepasScript = 'SELECT * FROM cepas WHERE user_id = $1';
    
    try {
        // Ejecutar la consulta para obtener todas las cepas de la tabla "cepas"
        const result = await connection.query(getAllCepasScript, [user_id]);
        if (result.rows.length > 0) {
            //como regreso el json pero tambien en cada registro un autoincremental llamado NumCepa
            
            res.status(200).json(result.rows); // Devolver todas las cepas encontradas
        } else {
            res.status(404).json({ message: 'No se encontraron cepas en la base de datos' });
        }
    } catch (error) {
        console.error('Error al obtener todas las cepas', error);
        res.status(500).json({ error: 'Error de servidor al obtener todas las cepas' });
    }
}


  module.exports = {
    addCepa, editCepa, deleteCepa, getCepa, getAllCepas
  };