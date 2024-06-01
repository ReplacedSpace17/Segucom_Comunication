const connection = require('../../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');

// Generate a unique ID
function UID() {
    return uuidv4();
}

// Obtener geocercas
function getGeocercas(req, res) {
    const query = 'SELECT GEOCERCA_DESCRIP, GEOCERCA_LOCALIZA FROM GEOCERCAS';
    return new Promise((resolve, reject) => {
        connection.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                const formattedResults = results.map(row => {
                    const perimetro = row.GEOCERCA_LOCALIZA
                        .split('\n')
                        .map(locationString => {
                            const coords = locationString
                                .replace(/[{}]/g, '')
                                .split(',')
                                .map(coord => coord.split(':').map(s => s.trim()));

                            return {
                                lat: parseFloat(coords[0][1]),
                                lng: parseFloat(coords[1][1])
                            };
                        });

                    return {
                        Nombre: row.GEOCERCA_DESCRIP,
                        Perimetro: perimetro
                    };
                });

                resolve(formattedResults);
                console.log('Obteniendo geocercas...');
                res.send(formattedResults);
            }
        });
    });
}

module.exports = {
    getGeocercas
};

