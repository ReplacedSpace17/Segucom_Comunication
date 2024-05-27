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
const { addUbicacion, getUbicaciones, getUbicacionesByID } = require('./Functions/Ubicaciones/Module_Location');


//-------------------------------------------------------------> Endpoints
// Agregar un nuevo usuario 
app.post('/segucom/api/user', async (req, res) => {
  const data = req.body;
  await addUserPersonal(req, res, data);
});

// Agregar una nueva ubicación
app.post('/segucom/api/ubicacion', async (req, res) => {
  const data = req.body;
  //console.log(data);
  await addUbicacion(req, res, data);
});

// Obtener todas las ubicaciones
app.get('/segucom/api/ubicacion', async (req, res) => {
  await getUbicaciones(req, res);
});

//obtener ubi por id
app.get('/segucom/api/ubicacion/:id', async (req, res) => {
  const id = req.params.id;
  await getUbicacionesByID(req, res, id);
});

// Iniciar sesión
app.post('/segucom/api/login', async (req, res) => {
  const { telefono, clave } = req.body;
  await loginUser(req, res, telefono, clave);
});



// Ruta de ejemplo
app.get('/test', (req, res) => {
  res.send('¡Hola, mundo!');
  //console.log("Test");
});

// Inicia el servidor
app.listen(port, () => {
  //console.log(`Servidor corriendo en http://localhost:${port}`);

});
