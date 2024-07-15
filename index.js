const { db_segucom, db_communication } = require('./SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');

const express = require('express');
const https = require('https');
const connection = require('./SQL_CONECTION'); // Asegúrate de tener esta importación correcta
const cors = require('cors');
const bodyParser = require('body-parser');
const { expressCspHeader, NONE, SELF } = require('express-csp-header');
const path = require('path');
const app = express();
const fs = require('fs');
const port = 3001;
const socketIo = require('socket.io');

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificates', 'PrivateKey.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificates', 'segubackend.com_2024.crt'))
};

// Crear servidor HTTPS
const server = https.createServer(httpsOptions, app);

// Inicializar Socket.IO con el servidor HTTPS
const io = socketIo(server);

// Configura CORS
const corsOptions = {
  origin: ['https://segucom.mx', 'http://localhost:3001',  'http://localhost:3000','http://localhost:3002', 'https://segubackend.com:3000',
     'https://localhost:3000', 'http://192.168.1.90'
  ],
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
// Configuración de carpeta estática
app.use('/MediaContent', express.static(path.join(__dirname, 'MediaContent')));


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
const { sendMessage, receiveMessages, receiveMessagesByChat, GetMessagesByGroup, GetMessagesFromGroupSpecific,
  sendMessageGroups, GetMessagesGroupWEB, GetNameRemitenteGroupChat, GetGroupsByElement
} = require('./Functions/Messages/Module_message');

const multer = require('multer');




// Configuración de almacenamiento de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const emisor = req.params.emisor;
    const dir = path.join('MediaContent', emisor);

    // Crear el directorio si no existe
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Generar nombre de archivo único
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/segucomunication/api/messages/image/:emisor/:receptor', upload.single('image'), async (req, res) => {
  console.log('Recibiendo imagen para chat');
  const emisor = req.params.emisor;
  const receptor = req.params.receptor;
  const data = JSON.parse(req.body.data); // Parsear el JSON recibido en 'data'
  
  // Extraer la fecha del objeto 'data'
  const fecha = data.FECHA;
  
  try {
    if (!req.file) {
      throw new Error('No se recibió ninguna imagen');
    }

    // Devolver la URL de la imagen guardada
    const imageUrl = `/MediaContent/${emisor}/${req.file.filename}`;
    
    // Crear el objeto JSON para enviar a la base de datos
    const messageData = {
      "FECHA": fecha,
      "RECEPTOR": receptor,
      "MENSAJE": 'IMAGE',
      "MEDIA": "IMAGE",
      "UBICACION": imageUrl
    };

    // Guardar el mensaje en la base de datos
    const script = `
      INSERT INTO MENSAJE_ELEMENTO (MENELEM_FEC, ELEMENTO_SEND, ELEMENTO_RECIBE, MENELEM_TEXTO, MENELEM_MEDIA, MENELEM_UBICACION)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db_communication.promise().query(script, [messageData.FECHA, emisor, messageData.RECEPTOR, messageData.MENSAJE, messageData.MEDIA, messageData.UBICACION]);
    console.log('Mensaje guardado en la base de datos:', messageData);

    // Enviar respuesta al cliente con la URL de la imagen
    res.status(200).json({ imageUrl, messageId: result.insertId });
  } catch (error) {
    console.error('Error al recibir la imagen o guardar el mensaje:', error.message);
    res.status(500).json({ error: 'Error en el servidor al enviar el mensaje' });
  }
});

//enviar imagen a grupo
app.post('/segucomunication/api/messages/image/group/image/:emisor/:receptor', upload.single('image'), async (req, res) => {
  console.log('Recibiendo imagen para chat');
  const emisor = req.params.emisor;
  const receptor = req.params.receptor;
  const data = JSON.parse(req.body.data); // Parsear el JSON recibido en 'data'
  
  // Extraer la fecha del objeto 'data'
  const fecha = data.FECHA;
  
  try {
    if (!req.file) {
      throw new Error('No se recibió ninguna imagen');
    }

    // Devolver la URL de la imagen guardada
    const imageUrl = `/MediaContent/${emisor}/${req.file.filename}`;
    
    // Crear el objeto JSON para enviar a la base de datos
    const messageData = {
      "FECHA": fecha,
      "RECEPTOR": receptor,
      "MENSAJE": 'IMAGE',
      "MEDIA": "IMAGE",
      "UBICACION": imageUrl
    };

    // Guardar el mensaje en la base de datos
    const script = `
    INSERT INTO MENSAJE_GRUPO 
        (MMS_FEC, MMS_TXT, MMS_IMG, MMS_OK, MMS_MEDIA, MMS_UBICACION, ELEMENTO_NUMERO, GRUPO_ID)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

const [result] = await db_communication.promise().query(script, [
    messageData.FECHA,
    messageData.MENSAJE,
   "NA", // Ajusta el nombre del campo según corresponda
    "NA", // Ajusta el nombre del campo según corresponda
    messageData.MEDIA,
    messageData.UBICACION,
    emisor, // Ajusta el nombre del campo según corresponda
    receptor// Ajusta el nombre del campo según corresponda
]);

console.log('Mensaje guardado en la base de datos:', messageData);


    // Enviar respuesta al cliente con la URL de la imagen
    res.status(200).json({ imageUrl, messageId: result.insertId });
  } catch (error) {
    console.error('Error al recibir la imagen o guardar el mensaje:', error.message);
    res.status(500).json({ error: 'Error en el servidor al enviar el mensaje' });
  }
});


// Endpoint para recibir audios
app.post('/segucomunication/api/messages/audio/:emisor/:receptor', upload.single('audio'), async (req, res) => {
  console.log('Recibiendo audio para chat');
  //obtener la fecha

  const emisor = req.params.emisor;
  const receptor = req.params.receptor;
  const fecha = req.body.FECHA;
  //obtener la fecha
  try {
    if (!req.file) {
      throw new Error('No se recibió ningún audio');
    }

    // Devolver la URL del audio guardado
    const audioUrl = `/MediaContent/${emisor}/${req.file.filename}`;

    const messageData = {
      "FECHA": fecha,
      "RECEPTOR": receptor,
      "MENSAJE": 'AUDIO',
      "MEDIA": "AUDIO",
      "UBICACION": audioUrl
    };

    // Guardar el mensaje en la base de datos
    const script = `
      INSERT INTO MENSAJE_ELEMENTO (MENELEM_FEC, ELEMENTO_SEND, ELEMENTO_RECIBE, MENELEM_TEXTO, MENELEM_MEDIA, MENELEM_UBICACION)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db_communication.promise().query(script, [messageData.FECHA, emisor, messageData.RECEPTOR, messageData.MENSAJE, messageData.MEDIA, messageData.UBICACION]);
    console.log('Mensaje guardado en la base de datos:', messageData);

    // Enviar respuesta al cliente con la URL de la imagen
    res.status(200).json({ audioUrl, messageId: result.insertId });
  } catch (error) {
    console.error('Error al recibir el audio:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para enviar audios a grupos
app.post('/segucomunication/api/messages/audio/groups/:emisor/:receptor', upload.single('audio'), async (req, res) => {
  console.log('Recibiendo audio para chat');
  //obtener la fecha

  const emisor = req.params.emisor;
  const receptor = req.params.receptor;
  const fecha = req.body.FECHA;
  //obtener la fecha
  try {
    if (!req.file) {
      throw new Error('No se recibió ningún audio');
    }

    // Devolver la URL del audio guardado
    const audioUrl = `/MediaContent/${emisor}/${req.file.filename}`;

    const messageData = {
      "FECHA": fecha,
      "RECEPTOR": receptor,
      "MENSAJE": 'AUDIO',
      "MEDIA": "AUDIO",
      "UBICACION": audioUrl
    };

       // Guardar el mensaje en la base de datos
       const script = `
       INSERT INTO MENSAJE_GRUPO 
           (MMS_FEC, MMS_TXT, MMS_IMG, MMS_OK, MMS_MEDIA, MMS_UBICACION, ELEMENTO_NUMERO, GRUPO_ID)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
   `;
   
   const [result] = await db_communication.promise().query(script, [
       messageData.FECHA,
       messageData.MENSAJE,
      "NA", // Ajusta el nombre del campo según corresponda
       "NA", // Ajusta el nombre del campo según corresponda
       messageData.MEDIA,
       messageData.UBICACION,
       emisor, // Ajusta el nombre del campo según corresponda
       receptor// Ajusta el nombre del campo según corresponda
   ]);
   
    // Enviar respuesta al cliente con la URL de la imagen
    res.status(200).json({ audioUrl, messageId: result.insertId });
  } catch (error) {
    console.error('Error al recibir el audio:', error.message);
    res.status(500).json({ error: error.message });
  }
});



//-------------------------------------------------------------> Endpoints App

// Obtener todos los usuarios disponibles
app.get('/segucomunication/api/users/:numero', async (req, res) => {
  const numero = req.params.numero;
  console.log('Obteniendo usuarios disponibles: ' + numero);
  getUsersAvailables(req, res, numero);
});

// Enviar un mensaje elemento sendMessageGroups
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
// Enviar un mensaje grupo 
app.post('/segucomunication/api/messages/group/:numTel', async (req, res) => {
  const numTel = req.params.numTel;
  const data = req.body;

  // Guarda el mensaje utilizando la función sendMessage
  sendMessageGroups(req, res, numTel, data);

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
  //console.log('Obteniendo chat de: ' + Emisor + ' en chat de ' + Receptor);
  receiveMessagesByChat(req, res, Emisor, Receptor);
});

// Obtener todos los mensajes de un grupo
app.get('/segucomunication/api/messagesGroup/:numElemento', async (req, res) => {
  const numElemento = req.params.numElemento;
  console.log('Obteniendo mensajes de grupo para el elemento: ' + numElemento);
  GetMessagesByGroup(req, res, numElemento);
});



// Obtener todos los mensajes de un chat específico
app.get('/segucomunication/api/messagesGroup/groupid/:idGroup', async (req, res) => {
  const id_Grupo = req.params.idGroup;
 
  //console.log('Obteniendo chat de: ' + Emisor + ' en chat de ' + Receptor);
  GetMessagesFromGroupSpecific(req, res, id_Grupo);
});




// Obtener todos los mensajes de gruposGetGroupsByElement
app.get('/segucomunication/api/messagesGroupWEB/groupsNames/:numElemento', async (req, res) => {
  const numElemento = req.params.numElemento;
  console.log('Obteniendo mensajes de grupo para el elemento: ' + numElemento);
  GetGroupsByElement(req, res, numElemento);
});

// Obtener todos los mensajes de grupos web GetMessagesGroupWEB
app.get('/segucomunication/api/messagesGroupWEB/:numElemento', async (req, res) => {
  const numElemento = req.params.numElemento;
  console.log('Obteniendo mensajes de grupo para el elemento: ' + numElemento);
  GetMessagesGroupWEB(req, res, numElemento);
});


//obtener el nombre GetNameRemitenteGroupChat
app.get('/segucomunication/api/messagesGroupWEB/name/:numElemento', async (req, res) => {
  const numElemento = req.params.numElemento;
  console.log('Obteniendo mensajes de grupo para el elemento: ' + numElemento);
  GetNameRemitenteGroupChat(req, res, numElemento);
});

//-------------------------------------------------------------> LLAMADAS Y VIDEOLLAMADAS

// Manejo de conexiones de Socket.IO
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Manejo del evento 'sendMessage' recibido desde el cliente
  socket.on('sendMessage', (newMessage) => {
    console.log('Nuevo mensaje enviado:', newMessage.MENSAJE);
    // Procesa el mensaje y emite a todos los clientes conectados
    io.emit('receiveMessage', newMessage);
  });



  //-------------------------------------------------------------> LLAMADAS Y VIDEOLLAMADAS
  socket.on('offer', (data) => {
    console.log('Offer received:', data);
    socket.broadcast.emit('offer', data);
  });
  
  socket.on('answer', (data) => {
    console.log('Answer received:', data);
    socket.broadcast.emit('answer', data);
  });

  socket.on('candidate', (data) => {
    console.log('Candidate received:', data);
    socket.broadcast.emit('candidate', data);
  });


  
  //fin - Manejo de eventos de llamadas y videollamadas

  // Manejo de desconexión de clientes
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});
//-------------------------------------------------------------> LLAMADAS Y VIDEOLLAMADAS

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
/*
http.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

*/




// Iniciar el servidor HTTPS
server.listen(port, () => {
  console.log(`Servidor HTTPS corriendo en https://0.0.0.0:${port}`);
});