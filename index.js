const express = require('express');
const connection = require('./SQL_CONECTION');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const nodemailer = require('nodemailer');
const session = require('express-session');
const multer = require('multer');
const { expressCspHeader, INLINE, NONE, SELF } = require('express-csp-header');
const path = require('path');
const app = express();
const port = 3000;

// Configura CORS
const corsOptions = {
  origin: ['https://segucom.mx', 'http://localhost:3001'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: '20mb' }));
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configura la carpeta public para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'tu_secreto',
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
const { addUserPersonal, loginUser, updatePerfilElemento } = require('./Functions/Register/Module_Register');

//-------------------------------------------------------------> IMPORTS DE FUNCTION MAPS
const { getGeocercas , getGeocercasID} = require('./Functions/Maps/Function_region');
const { LocalizarElemento, UpdateUbicacion, LocalizarTodosElemento} = require('./Functions/Maps/Function_elemento');
const {getPuntosVigilancia, getElementosAsignados, getPuntosVigilanciaByID} = require('./Functions/Maps/FunctionPuntoVigilancia');

//-------------------------------------------------------------> Endpoints App
// Agregar un nuevo usuario
app.post('/segucom/api/user', async (req, res) => {
  const data = req.body;
  await addUserPersonal(req, res, data);
});

// Iniciar sesión
app.post('/segucom/api/login', async (req, res) => {
  const { telefono, clave } = req.body;
  await loginUser(req, res, telefono, clave);
});

//actualizar perfil de un elemento
app.put('/segucom/api/user/:id', async (req, res) => {
  const data = req.body;
  const id = req.params.id;
  await updatePerfilElemento(req, res, data, id);
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

//-------------------------------------------------------------> Rutas de mapas

// Ruta para servir la página de mapas
app.get('/maps/elemento', (req, res) => {
  res.sendFile(path.join(__dirname, 'maps', 'mapaElemento.html'));
});
// Ruta para servir la página de mapas
app.get('/maps/geocercas', (req, res) => {
  res.sendFile(path.join(__dirname, 'maps', 'mapaRegiones.html'));
});
// Ruta para servir la página de mapas
app.get('/maps/elementos/geocerca', (req, res) => {
  res.sendFile(path.join(__dirname, 'maps', 'mapaElementoRegion.html'));
});
// Ruta para servir la página de mapas
app.get('/maps/vigilancia/punto', (req, res) => {
  res.sendFile(path.join(__dirname, 'maps', 'mapaPuntoVigilancia.html'));
});

// Ruta de ejemplo
app.get('/test', (req, res) => {
  res.send('¡Hola, mundo!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});

/* Mapas:
http://localhost:3000/maps/elemento?elementoId=80000
http://localhost:3000/maps/geocercas?regionId=31
http://localhost:3000/maps/elementos/geocerca?regionId=29
http://localhost:3000/maps/vigilancia/punto?puntoId=3



*/