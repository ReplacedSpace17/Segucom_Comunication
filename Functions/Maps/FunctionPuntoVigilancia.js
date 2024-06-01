const connection = require('../../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');

// Generate a unique ID
function UID() {
    return uuidv4();
}

// Obtener geocercas
function getPuntosVigilancia(req, res) {
    const query = 'SELECT VIGLIA_ID , VIGILA_FEC, VIGILA_SERVICIO  , VIGILA_LATITUD , VIGILA_LONGITUD  from PUNTO_VIGILANCIA ;';
    return new Promise((resolve, reject) => {
        connection.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                

        
                console.log('Obteniendo Puntos vigilancia...');
                res.send(results);
            }
        });
    });
}

function getElementosAsignados(req, res, PuntoID) {
    const query = `SELECT PE.VIELEM_ID, PE.ELEMENTO_ID, E.ELEMENTO_LATITUD, E.ELEMENTO_LONGITUD, E.ELEMENTO_NOMBRE, E.ELEMENTO_PATERNO, E.ELEMENTO_MATERNO, E.ELEMENTO_NUMERO, E.ELEMENTO_FEC  
                   FROM PUNTO_ELEMENTO PE
                   INNER JOIN ELEMENTO E ON PE.ELEMENTO_ID = E.ELEMENTO_ID
                   WHERE PE.VIGILA_ID = ?`;

    return new Promise((resolve, reject) => {
        connection.query(query, [PuntoID], (error, results) => {
            if (error) {
                reject(error);
            } else {
                console.log('Obteniendo elementos asignados...');
                res.send(results);
            }
        });
    });
}


module.exports = {
    getPuntosVigilancia, getElementosAsignados
};

