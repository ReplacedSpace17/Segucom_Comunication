const express = require('express');
const connection = require('./SQL_CONECTION'); // Asegúrate de tener esta importación correcta
const cors = require('cors');
const bodyParser = require('body-parser');
const { expressCspHeader, NONE, SELF } = require('express-csp-header');
const path = require('path');
const app = express();
const http = require('http').createServer(app); // Usamos createServer para http
const io = require('socket.io')(http); // Pasamos http al socket.io
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

app.use(expressCspHeader({ 
    policies: { 
        'default-src': [NONE], 
        'img-src': [SELF], 
        'script-src': [SELF],
        'style-src': [SELF],
        'object-src': [NONE],
        'frame-src': [NONE],
        'base-uri': [NONE],
        'form-action': [NONE],
        'frame-ancestors': [NONE],
        'manifest-src': [NONE],
        'media-src': [NONE],
        'worker-src': [NONE]
    } 
}));

//Imports
const { getUsersAvailables } = require('./Functions/Users/Module_Users');
const { sendMessage, receiveMessages, receiveMessagesByChat } = require('./Functions/Messages/Module_message');

//-------------------------------------------------------------> Endpoints App

// Obtener todos los usuarios disponibles
app.get('/segucomunication/api/users/:numero', async (req, res) => {
  const numero = req.params.numero;
  console.log('Obteniendo usuarios disponibles: ' + numero);
  getUsersAvailables(req, res, numero);
});

// Enviar un mensaje
app.post('/segucomunication/api/messages/:numTel', async (req, res) => {
  const numTel = req.params.numTel;
  const data = req.body;

  // Guarda el mensaje utilizando la función sendMessage
  sendMessage(req, res, numTel, data);

  // Emitir evento para enviar mensaje vía Socket.IO
  io.emit('sendMessage', {
    senderId: numTel,
    recipientId: data.RECEPTOR,
    content: data.MENSAJE,
  });

  
});

// Recibir mensajes CHATS
app.get('/segucomunication/api/messages/:numElemento', async (req, res) => {
  const numElemento = req.params.numElemento;
  console.log('Obteniendo mensajes para el elemento: ' + numElemento);
  receiveMessages(req, res, numElemento);
});

// Obtener todos los mensajes de un chat específico
app.get('/segucomunication/api/messages/:Emisor/:Receptor', async (req, res) => {
  const Emisor = req.params.Emisor;
  const Receptor = req.params.Receptor;
  console.log('Obteniendo chat de: ' + Emisor + ' en chat de ' + Receptor);
  receiveMessagesByChat(req, res, Emisor, Receptor);
});

//-------------------------------------------------------------> LLAMADAS Y VIDEOLLAMADAS

// Manejo de conexiones de Socket.IO
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Manejo del evento 'sendMessage' recibido desde el cliente
  socket.on('sendMessage', (newMessage) => {
    console.log('Nuevo mensaje recibido desde cliente:', newMessage);
    // Procesa el mensaje y emite a todos los clientes conectados
    io.emit('receiveMessage', newMessage);
  });

  // Eventos de llamada
// Evento para iniciar una llamada de voz
socket.on('startVoiceCall', (callData) => {
  console.log('Llamada de voz iniciada:', callData);
  // Emite el evento a la persona llamada
  io.to(callData.receiverId.toString()).emit('incomingCall', callData);
});



  socket.on('startVideoCall', (callData) => {
    console.log('Videollamada iniciada:', callData);
    // Emite el evento a la persona llamada
    io.to(callData.receiverId).emit('incomingCall', callData);
  });

  // Manejo de desconexión de clientes
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});


// Ruta de ejemplo
app.get('/test', (req, res) => {
  res.send('¡Hola, mundo BACKEND COMMUNICATION!');
});

// Ruta para iniciar una llamada de prueba
app.get('/test-call', (req, res) => {
  const callData = {
    callerId: '80001',
    receiverId: '80000',
    callerName: 'User1 test admin'
  };
  
  // Emite el evento a la persona llamada
  io.to('80000').emit('incomingCall', callData);
  
  res.send('Llamada de prueba iniciada correctamente');
});


// Iniciar el servidor HTTP
http.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
