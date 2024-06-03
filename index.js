const express = require('express');
const connection = require('./SQL_CONECTION');
const cors = require('cors'); // Importa el middleware CORS
const bodyParser = require('body-parser');
const fs = require('fs');
const nodemailer = require('nodemailer');
const session = require('express-session');
const multer = require('multer');
const { expressCspHeader, INLINE, NONE, SELF } = require('express-csp-header');
const app = express();
const port = 3000;

// Configura CORS
const corsOptions = {
  origin: ['https://segucom.mx', 'http://localhost:3001'], // Array de dominios permitidos
  optionsSuccessStatus: 200 // Para navegadores legacy (IE11, varios SmartTVs)
};

app.use(cors(corsOptions)); // Aplica el middleware CORS

app.use(bodyParser.json({ limit: '20mb' })); // Ajusta el límite según tus necesidades
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.use(session({
  secret: 'tu_secreto', // Cambia esto a una cadena secreta segura
  resave: false,
  saveUninitialized: true
}));

app.use(expressCspHeader({ 
    policies: { 
        'default-src': [expressCspHeader.NONE], 
        'img-src': [expressCspHeader.SELF], 
        'script-src': [expressCspHeader.SELF],
        'style-src': [expressCspHeader.SELF],
        'object-src': [expressCspHeader.NONE],
        'frame-src': [expressCspHeader.NONE],
        'base-uri': [expressCspHeader.NONE],
        'form-action': [expressCspHeader.NONE],
        'frame-ancestors': [expressCspHeader.NONE],
        'manifest-src': [expressCspHeader.NONE],
        'media-src': [expressCspHeader.NONE],
        'worker-src': [expressCspHeader.NONE]
    } 
}));  

//-------------------------------------------------------------> IMPORTS DE FUNCTION SEGUCOM
const { addUserPersonal, loginUser } = require('./Functions/Register/Module_Register');

//-------------------------------------------------------------> IMPORTS DE FUNCTION MAPS
const { getGeocercas , getGeocercasID} = require('./Functions/Maps/Function_region');
const { LocalizarElemento, UpdateUbicacion, LocalizarTodosElemento} = require('./Functions/Maps/Function_elemento');
const {getPuntosVigilancia, getElementosAsignados, getPuntosVigilanciaByID} = require('./Functions/Maps/FunctionPuntoVigilancia');

//-------------------------------------------------------------> Endpoints App
// Agregar un nuevo usuario   falta cifrar
app.post('/segucom/api/user', async (req, res) => {
  const data = req.body;
  await addUserPersonal(req, res, data);
});

// Iniciar sesión falta cifrar
app.post('/segucom/api/login', async (req, res) => {
  const { telefono, clave } = req.body;
  await loginUser(req, res, telefono, clave);
});

//-------------------------------------------------------------> Endpoints Mapas
// Obtener el perimetro de geocercas
app.get('/segucom/api/maps/geocercas', async (req, res) => {
  await getGeocercas(req, res);
});

// Obtener geocercas por id
app.get('/segucom/api/maps/geocercas/:id', async (req, res) => {
  const id = req.params.id;
  await getGeocercasID(req, res, id);
});

// Localizar un elemento
app.get('/segucom/api/maps/elemento/:id', async (req, res) => {
  const id = req.params.id;
  await LocalizarElemento(req, res, id);
});

// Obtener todos los elementos
app.get('/segucom/api/maps/elementos/all', async (req, res) => {
  await LocalizarTodosElemento(req, res);
});

// Actualizar ubicacion de un elemento
app.put('/segucom/api/maps/elemento/:id', async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  await UpdateUbicacion(req, res, data, id);
});

// Obtener los puntos de vigilancia
app.get('/segucom/api/maps/puntosvigilancia', async (req, res) => {
  await getPuntosVigilancia(req, res);
});

// Obtener los elementos asignados a un punto de vigilancia
app.get('/segucom/api/maps/puntosvigilancia/elementos/:id', async (req, res) => {
  const puntoID = req.params.id;
  await getElementosAsignados(req, res, puntoID);
});

// Obtener punto de vigilancia por id
app.get('/segucom/api/maps/puntosvigilancia/:id', async (req, res) => {
  const id = req.params.id;
  await getPuntosVigilanciaByID(req, res, id);
});

// Ruta de ejemplo
app.get('/test', (req, res) => {
  res.send('¡Hola, mundo!');
  //console.log("Test");
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});
