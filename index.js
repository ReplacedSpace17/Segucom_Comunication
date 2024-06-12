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
const socketIo = require('socket.io');
const http = require('http');
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

const server = http.createServer(app);
const io = socketIo(server);
//Imports
const { getUsersAvailables } = require('./Functions/Users/Module_Users');
const { sendMessage, getMessages, reactToMessage, getReactions } = require('./Functions/Messages/Module_message');
//-------------------------------------------------------------> Endpoints App
// Obtener todos los usuarios disponibles
app.get('/segucomunication/api/users', async (req, res) => {
  getUsersAvailables(req, res);
});

//-------------------------------------------------------------> MENSAJES
// Enviar un mensaje
app.post('/segucomunication/api/messages', async (req, res) => {
  sendMessage(req, res);
});

// Obtener todos los mensajes
app.get('/segucomunication/api/messages', async (req, res) => {
  getMessages(req, res);
});

// Reaccionar a un mensaje
app.post('/segucomunication/api/reactions', async (req, res) => {
  reactToMessage(req, res);
});

// Obtener todas las reacciones
app.get('/segucomunication/api/reactions', async (req, res) => {
  getReactions(req, res);
});


//-------------------------------------------------------------> LLAMADAS Y VIDEOLLAMADAS
io.on('connection', (socket) => {
  console.log('New client connected');
  //mensajes
  socket.on('sendMessage', (data) => {
    const { senderId, recipientId, content } = data;
    io.to(recipientId).emit('receiveMessage', { senderId, content });
});

socket.on('reactToMessage', (data) => {
    const { messageId, elementoId, reactionType } = data;
    io.emit('messageReaction', { messageId, elementoId, reactionType });
});
  //llamadas
  socket.on('call', (data) => {
      const { from, to, offer } = data;
      io.to(to).emit('call', { from, offer });
  });

  socket.on('answer', (data) => {
      const { from, to, answer } = data;
      io.to(to).emit('answer', { from, answer });
  });

  socket.on('candidate', (data) => {
      const { from, to, candidate } = data;
      io.to(to).emit('candidate', { from, candidate });
  });

  socket.on('disconnect', () => {
      console.log('Client disconnected');
  });
});

// Ruta de ejemplo
app.get('/test', (req, res) => {
  res.send('¡Hola, mundo BACKEND COMMUNICATION!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});

