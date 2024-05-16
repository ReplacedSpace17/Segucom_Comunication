const connection = require('../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');

function generarID() {
  return uuidv4();
}

// Función para agregar una nueva cepa
async function addCultivo(req, res, data) {
    const cultivo_id = generarID(); // Generar un nuevo ID para la cepa
    const { cepa_id, user_id, nombre, motivo } = data; // Obtener los datos de la cepa desde la solicitud
    const addCultivoScript = 'INSERT INTO cultivos (id, user_id, nombre, cepa_id, motivo) VALUES ($1, $2, $3, $4, $5)';
    
    try {
        // Ejecutar la consulta para agregar la cepa a la tabla "cepas"
        await connection.query(addCultivoScript, [cultivo_id, user_id, nombre, cepa_id, motivo]);
        console.log('Cultivo creado correctamente');
        res.status(201).json({ message: 'Cultivo creado correctamente', cultivo_id: cultivo_id });
    } catch (error) {
        console.error('Error al agregar la cepa', error);
        res.status(500).json({ error: 'Error de servidor al agregar la cepa' });
    }
}

// Función para editar un cultivo existente
async function editCultivo(req, res, data, id) {
    const { nombre, motivo, cepa_id } = data; 
    console.log(nombre);
    console.log(motivo);
    console.log(cepa_id);
    console.log(id);
    const editCultivoScript = 'UPDATE cultivos SET nombre = $1, motivo = $2, cepa_id=$3 WHERE id = $4';
    
    try {
        
        // Ejecutar la consulta para editar el cultivo en la tabla "cultivos"
        await connection.query(editCultivoScript, [nombre, motivo,cepa_id, id]);
        console.log('Cultivo editado correctamente');
        res.status(200).json({ message: 'Cultivo editado correctamente', cultivo_id: id });
    } catch (error) {
        console.error('Error al editar el cultivo', error);
        res.status(500).json({ error: 'Error de servidor al editar el cultivo' });
    }
}


// Función para eliminar una cepa existente
async function deleteCultivo(req, res, cepa_id) {
    const deleteCepaScript = 'DELETE FROM cultivos WHERE id = $1';
    
    try {
        // Ejecutar la consulta para eliminar la cepa de la tabla "cepas"
        await connection.query(deleteCepaScript, [cepa_id]);
        res.status(200).json({ message: 'Cultivo eliminado correctamente', cepa_id: cepa_id });
    } catch (error) {
        console.error('Error al eliminar la cepa', error);
        res.status(500).json({ error: 'Error de servidor al eliminar la cepa' });
    }
}

// Función para obtener información de una cepa
async function getCultivo(req, res, cepa_id) {
    const getCepaScript = 'SELECT * FROM cepas WHERE id = $1';
    
    try {
        // Ejecutar la consulta para obtener información de la cepa de la tabla "cepas"
        const result = await connection.query(getCepaScript, [cepa_id]);
        if (result.rows.length > 0) {
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
async function getAllCultivos(req, res, user_id) {
    const getAllCepasScript = 'SELECT c.*, ce.nombre AS nombre_cepa FROM cultivos c INNER JOIN cepas ce ON c.cepa_id = ce.id WHERE c.user_id = $1;';
    
    try {
        // Ejecutar la consulta para obtener todas las cepas de la tabla "cepas"
        const result = await connection.query(getAllCepasScript, [user_id]);
        if (result.rows.length > 0) {
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
    addCultivo,
    editCultivo,
    deleteCultivo,
    getCultivo,
    getAllCultivos
  };