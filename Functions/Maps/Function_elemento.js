const connection = require('../../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');

// Generate a unique ID
function UID() {
    return uuidv4();
}

// Obtener la latitud y lon de un elemento
// Obtener geocercas
function LocalizarElemento(req, res, Num_elemento) {
    const query = 'SELECT ELEMENTO_NUMERO, ELEMENTO_NOMBRE, ELEMENTO_PATERNO , ELEMENTO_MATERNO , ELEMENTO_LATITUD, ELEMENTO_LONGITUD , ELEMENTO_ULTIMALOCAL, ELEMENTO_ID FROM ELEMENTO WHERE ELEMENTO_NUMERO = ?';
    
    connection.query(query, [Num_elemento], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            console.log('Elemento localizado ' + Num_elemento + ' con latitud: ' + results[0].ELEMENTO_LATITUD + ' y longitud: ' + results[0].ELEMENTO_LONGITUD);
            res.json(results);
        }
    });
}

function LocalizarTodosElemento(req, res) {
    const query = 'SELECT ELEMENTO_NUMERO, ELEMENTO_NOMBRE, ELEMENTO_PATERNO , ELEMENTO_MATERNO , ELEMENTO_LATITUD, ELEMENTO_LONGITUD , ELEMENTO_ULTIMALOCAL, ELEMENTO_ID FROM ELEMENTO ';
    
    connection.query(query, [], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            console.log('Elementos localizados (all)');
            res.json(results);
        }
    });
}

//modificar ubicacion
function UpdateUbicacion(req, res, data, Num_tel) {
    const query = 'UPDATE ELEMENTO SET ELEMENTO_LATITUD = ?, ELEMENTO_LONGITUD = ?, ELEMENTO_ULTIMALOCAL= ? WHERE ELEMENTO_TELNUMERO = ?';
  

    connection.query(query, [data.ELEMENTO_LATITUD, data.ELEMENTO_LONGITUD, data.ELEMENTO_ULTIMALOCAL, Num_tel], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            console.log('Ubicacion actualizada de elemento: ' + Num_tel + ' a latitud: ' + data.ELEMENTO_LATITUD + ' y longitud: ' + data.ELEMENTO_LONGITUD);
            res.json(results);
        }
    });
}



module.exports = {
    LocalizarElemento,
    UpdateUbicacion,
    LocalizarTodosElemento
};

