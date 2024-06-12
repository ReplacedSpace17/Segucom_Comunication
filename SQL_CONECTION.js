const mysql = require('mysql2');

// Conexión a la base de datos local
const db_segucom = mysql.createPool({
  host: 'localhost',
  user: 'API_User',
  password: 'VJQy9lCOUWsB3wZ',
  database: 'segucomm_db',
  port: 3306
});

// Conexión a la base de datos de producción
const db_communication = mysql.createPool({
  host: 'localhost',
  user: 'API_User',
  password: 'VJQy9lCOUWsB3wZ',
  database: 'segucomm_comunication',
  port: 3306
});

// Verificar la conexión a la base de datos local
db_segucom.getConnection((err, conn) => {
  if (err) {
    console.error('Error al conectar a la base de datos local:', err);
  } else {
    console.log('Conexión exitosa a la base de datos segucomm_db');
    conn.release();
  }
});

// Verificar la conexión a la base de datos de producción
db_communication.getConnection((err, conn) => {
  if (err) {
    console.error('Error al conectar a la base de datos de producción:', err);
  } else {
    console.log('Conexión exitosa a la base de datos de segucomm_comunication');
    conn.release();
  }
});

module.exports = {
  localConnection: db_segucom,
  productionConnection: db_communication
};


/*
CREATE DATABASE segucomm_comunication;
CREATE USER 'API_User'@'%' IDENTIFIED BY 'VJQy9lCOUWsB3wZ';

GRANT ALL PRIVILEGES ON segucomm_db.* TO 'API_User'@'localhost' IDENTIFIED BY 'VJQy9lCOUWsB3wZ';
FLUSH PRIVILEGES;
GRANT ALL PRIVILEGES ON segucomm_comunication.* TO 'API_User'@'localhost' IDENTIFIED BY 'VJQy9lCOUWsB3wZ';
FLUSH PRIVILEGES;



 USER 1 
4791011283
admin

 USER 2
4791012487
admin
*/