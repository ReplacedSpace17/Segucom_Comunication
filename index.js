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
const port = 3001;

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

//-------------------------------------------------------------> IMPORTS DE FUNCTION MAPS

//-------------------------------------------------------------> Endpoints App
// Agregar un nuevo usuario
app.post('/segucom/api/user', async (req, res) => {
  const data = req.body;

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