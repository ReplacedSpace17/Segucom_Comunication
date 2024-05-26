const { Pool } = require('pg');


const connection = new Pool({
  user: 'postgres',
  host: 'localhost', // o la dirección de tu servidor PostgreSQL
  database: 'segucomdb',
  password: 'root',
  port: 5432, // El puerto predeterminado de PostgreSQL es 5432
});


/*
Base de datos
Host: segucom.mx
Port: 3306
User: segucomm_admin
Pass: s3guC0m@7am

const connection = new Pool({
  user: 'bioharvest_user',
  host: 'dpg-cmsfsued3nmc73esh140-a.oregon-postgres.render.com',
  database: 'bioharvest',
  password: 'PfCB7mQIE209GgpsHTjZlivaEmgeKrlc',
  port: 5432,
  ssl: true // Agregar esta línea
});
*/


connection.connect((error, client, done) => {
  if (error) {
    console.error('Error al conectar a la base de datos:', error);
  } else {
    console.log('Conexión exitosa a la base de datos');
    console.log('\n---------------------💻 Segucom Running API 💻---------------');
  }
});

module.exports = connection;


/*
CONECCION EN LINUX

const connection = new Pool({
  user: 'postgres',
  host: 'localhost', // o la dirección de tu servidor PostgreSQL
  database: 'cognitivedb',
  password: 'root',
  port: 5432, // El puerto predeterminado de PostgreSQL es 5432
});

CONECCION EN windows

const connection = new Pool({
  user: 'postgres',
  host: 'localhost', // o la dirección de tu servidor PostgreSQL
  database: 'cognitivedb',
  password: 'root',
  port: 5432, // El puerto predeterminado de PostgreSQL es 5432
});

 Para acceder a postgresql
 sudo -u postgres psql

 Mostrar db
 \l

 Conectarme a db
 \c nameDB;
 Listar tablas
 \dt
 */