const express = require('express');
const connection = require('./SQL_CONECTION');
const app = express();
const port = 3000;
const cors = require('cors'); // Importa el middleware CORS
const bodyParser = require('body-parser');
const fs = require('fs');
const nodemailer = require('nodemailer');
app.use(bodyParser.json({ limit: '20mb' })); // Ajusta el límite según tus necesidades
app.use('/uploads', express.static('uploads'));
app.use(cors()); // Habilita el middleware CORS
app.use(express.json());
const session = require('express-session');
const multer = require('multer');
// Importa la librería jsonwebtoken

// Configura express-session

app.use(session({
  secret: 'tu_secreto', // Cambia esto a una cadena secreta segura
  resave: false,
  saveUninitialized: true
}));


//-------------------------------------------------------------> IMPORTS DE FUNCTION SEGUCOM
const { addUserPersonal, loginUser } = require('./Functions/Register/Module_Register');

//-------------------------------------------------------------> IMPORTS DE FUNCTION MAPS
const { getGeocercas } = require('./Functions/Maps/Function_region');
const { LocalizarElemento, UpdateUbicacion, LocalizarTodosElemento} = require('./Functions/Maps/Function_elemento');
const {getPuntosVigilancia, getElementosAsignados} = require('./Functions/Maps/FunctionPuntoVigilancia');

//-------------------------------------------------------------> Endpoints App
// Agregar un nuevo usuario   falta cifrar
app.post('/segucom/api/user', async (req, res) => {
  const data = req.body;
  await addUserPersonal(req, res, data);
});
/*
http://localhost:3000/segucom/api/user
{
    "No_Empleado": 80000,
    "Nombre": "Juan Perez",
    "Telefono": "4791039914",
    "IMEI": "123456789012345",
    "Clave": "password123"
}
*/



// Iniciar sesión falta cifrar
app.post('/segucom/api/login', async (req, res) => {
  const { telefono, clave } = req.body;
  await loginUser(req, res, telefono, clave);
});
/*
http://localhost:3000/segucom/api/login
{
  "telefono": 123,
  "clave": 123
}
*/


//-------------------------------------------------------------> Endpoints Mapas

//Obtener el perimetro de geocercas
//http://localhost:3000/segucom/api/maps/geocercas
app.get('/segucom/api/maps/geocercas', async (req, res) => {
  await getGeocercas(req, res);
});

/*Localizar un elemento
http://localhost:3000/segucom/api/maps/elemento/80000
*/
app.get('/segucom/api/maps/elemento/:id', async (req, res) => {
  const id = req.params.id;
  await LocalizarElemento(req, res, id);
});

//obtener todos los elementos
//http://localhost:3000/segucom/api/maps/elementos/all
app.get('/segucom/api/maps/elementos/all', async (req, res) => {
  await LocalizarTodosElemento(req, res);
});

//Actualizar ubicacion de un elemento
/*
http://localhost:3000/segucom/api/maps/elemento/4791039914

leon
{
  "ELEMENTO_ULTIMALOCAL": "2024-05-31T13:45:30.000Z",
  "ELEMENTO_LATITUD": 21.132520, 
  "ELEMENTO_LONGITUD": -101.693917
}

gto
{
  
    "ELEMENTO_LATITUD": 21.020068,
    "ELEMENTO_LONGITUD": -101.266249,
    "ELEMENTO_ULTIMALOCAL": "2024-06-01T01:45:30.000Z"
  }

  punto vigilancia dolores
{
  
    "ELEMENTO_LATITUD": 21.152252, 
    "ELEMENTO_LONGITUD": -100.911718,
    "ELEMENTO_ULTIMALOCAL": "2024-06-01T01:45:30.000Z"
  }

  

*/
app.put('/segucom/api/maps/elemento/:id', async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  await UpdateUbicacion(req, res, data, id);
  
});



//Obtener los puntos de vigilancia
//http://localhost:3000/segucom/api/maps/puntosvigilancia
app.get('/segucom/api/maps/puntosvigilancia', async (req, res) => {
  await getPuntosVigilancia(req, res);
});

//Obtener los elementos asignados a un punto de vigilancia
//http://localhost:3000/segucom/api/maps/puntosvigilancia/3
app.get('/segucom/api/maps/puntosvigilancia/:id', async (req, res) => {
  const puntoID = req.params.id;
  await getElementosAsignados(req, res, puntoID);
});



/*

UPDATE PUNTO_ELEMENTO
SET 
    VIGILA_ID = 3,
    ELEMENTO_ID = 3647
WHERE VIELEM_ID = 2;


SELECT PERFIL_NOMBRE , PERFIL_CLAVE , PERFIL_ANDROID , ELEMENTO_NUMERO  FROM PERFIL_ELEMENTO WHERE ELEMENTO_TELNUMERO = 4791039914;

SELECT ELEMENTO_TELNUMERO  FROM ELEMENTO WHERE ELEMENTO_NUMERO =80000;


SELECT *  FROM PERFIL_ELEMENTO WHERE ELEMENTO_TELNUMERO = 4791039914 AND  PERFIL_CLAVE ="password123";

*/


// Ruta de ejemplo
app.get('/test', (req, res) => {
  res.send('¡Hola, mundo!');
  //console.log("Test");
});

// Inicia el servidor
app.listen(port, () => {
  //console.log(`Servidor corriendo en http://localhost:${port}`);

});
