const { db_segucom, db_communication } = require('./SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const express = require('express');
const https = require('https');
const http = require('http');
const connection = require('./SQL_CONECTION'); // Asegúrate de tener esta importación correcta
const cors = require('cors');
const bodyParser = require('body-parser');
const { expressCspHeader, NONE, SELF } = require('express-csp-header');
const path = require('path');
const app = express();
const fs = require('fs');
const port = 3001;
const socketIo = require('socket.io');
const ffmpeg = require('fluent-ffmpeg');
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificates', 'PrivateKey.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificates', 'segubackend.com_2024_bundle.crt'))
};
const { exec } = require('child_process');

const Server = require('./Server'); // Importar la clase Server

// Crear servidor HTTPS
const server = https.createServer(httpsOptions, app);

//const server = http.createServer(app);

// Inicializar Socket.IO con el servidor HTTPS
const io = socketIo(server);

// Configura CORS
// Configuración de CORS
const corsOptions = {
  origin: [
    'https://segucom.mx',
    'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://192.168.1.68',
    'https://localhost:3000',
    'https://segubackend.com:3000',
    'https://segubackend.com',
    '192.168.1.90',
    'http://192.168.1.90:3000',
    '*'
  ],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
//app.use(cors());
app.use(bodyParser.json({ limit: '1000mb' }));
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
const { getUsersAvailables, AddAlertaPanico } = require('./Functions/Users/Module_Users');
const { sendMessage, receiveMessages, receiveMessagesByChat, GetMessagesByGroup, GetMessagesFromGroupSpecific,
  sendMessageGroups, GetMessagesGroupWEB, GetNameRemitenteGroupChat, GetGroupsByElement, GetGroupIdsByElemento, getMessagesIfExists, getMembers,
  getIDsGroupsByElement
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

const serverStats = new Server();// Importar la clase Server



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


//-----------------------------enviar VIDEOS
app.post('/segucomunication/api/messages/video/group/video/:emisor/:receptor', upload.single('video'), async (req, res) => {
  console.log('Recibiendo video para chat');
  const emisor = req.params.emisor;
  const receptor = req.params.receptor;
  const data = JSON.parse(req.body.data); // Parsear el JSON recibido en 'data'
  const fecha = data.FECHA;

  try {
    if (!req.file) {
      throw new Error('No se recibió ningún video');
    }

    // Definir rutas de entrada y salida
    const inputVideoPath = req.file.path;
    const outputVideoPath = path.join(path.dirname(inputVideoPath), 'compressed_' + req.file.filename);

    // Comprimir el video
    ffmpeg(inputVideoPath)
      .outputOptions([
        '-vcodec', 'libx264',
        '-crf', '30',
        '-vf', 'scale=w=640:h=-1:force_original_aspect_ratio=decrease' // Escalar manteniendo la relación de aspecto
      ])
      .save(outputVideoPath)
      .on('end', async () => {
        // Devolver la URL del video guardado
        const videoUrl = `/MediaContent/${emisor}/compressed_${req.file.filename}`;

        // Crear el objeto JSON para enviar a la base de datos
        const messageData = {
          "FECHA": fecha,
          "RECEPTOR": receptor,
          "MENSAJE": 'VIDEO',
          "MEDIA": "VIDEO",
          "UBICACION": videoUrl
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
          receptor // Ajusta el nombre del campo según corresponda
        ]);

        console.log('VIDEO guardado en la base de datos:', messageData);

        // Enviar respuesta al cliente con la URL del video
        res.status(200).json({ videoUrl, messageId: result.insertId });
      })
      .on('error', (err) => {
        console.error('Error al comprimir el video:', err.message);
        res.status(500).json({ error: 'Error al comprimir el video' });
      });
  } catch (error) {
    console.error('Error al recibir el video o guardar el mensaje:', error.message);
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
app.get('/segucomunication/api/newmessage/:emisor/:receptor', async (req, res) => {
  const emisor = req.params.emisor;
  const receptor = req.params.receptor;
  console.log('Obteniendo mensajes entre el emisor: ' + emisor + ' y el receptor: ' + receptor);
  await getMessagesIfExists(req, res, emisor, receptor);
});

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
app.get('/segucomunication/api/messagesGroupWEB/:numElemento/:idGrupo', async (req, res) => {
  const numElemento = req.params.numElemento;
  const idGrupo = req.params.idGrupo;
  console.log('Obteniendo mensajes de grupo para el elemento: ' + numElemento);
  GetMessagesGroupWEB(req, res, numElemento, idGrupo);
});


//obtener el nombre GetNameRemitenteGroupChat
app.get('/segucomunication/api/messagesGroupWEB/name/:numElemento', async (req, res) => {
  const numElemento = req.params.numElemento;
  console.log('Obteniendo mensajes de grupo para el elemento: ' + numElemento);
  GetNameRemitenteGroupChat(req, res, numElemento);
});

//obtener los ids de grupo GetGroupIdsByElemento
app.get('/segucomunication/api/messagesGroupWEB/ids/:numElemento', async (req, res) => {
  const numElemento = req.params.numElemento;
  console.log('Obteniendo mensajes de grupo para el elemento: ' + numElemento);
  GetGroupIdsByElemento(req, res, numElemento);
});


//-------------------------------------------------------------> BOTON DE PÁNICO con AddAlertaPanico
//https://localhost:3001/segucomunication/api/alerta
/*
{
    "ALARMA_FEC": "2024-07-24 10:30:00",
    "ELEMENTO_NUMERO": 80000,
    "ELEMENTO_TEL_NUMERO": 5566778899,
    "ALARMA_UBICA": "lat:-10.234344,lon:19.35234"
}
*/
app.post('/segucomunication/api/alerta', async (req, res) => {
  const data = req.body;
  console.log('Recibiendo alerta de pánico en endpoint:', data);

  // Guarda la alerta de pánico utilizando la función AddAlertaPanico
  AddAlertaPanico(req, res, data);
  io.emit('panicoAlerta', data);
});

// Endpoint para enviar notificacion de una consigna

//endpoint para notificar a un usuario que se le asigno una consigna o alertamiento
app.post('/segucomunication/api/notificacion', async (req, res) => {
  const data = req.body;
  console.log('Recibiendo asignacion:', data);
  //validar que data.type y data.listaElementos existan
  if (!data.type || !data.listaElementos) {
    return res.status(400).json({ error: 'Faltan datos en la solicitud' });
  }
  else {
    
    io.emit('notificarAsignacion', data);

    
    const messa = {
      "MENSAJE_ID": 1725834073139,
  "FECHA": '2024-09-08 16:21:13',
  "REMITENTE": '80000',
  "MENSAJE": 'wwe',
  "MEDIA": 'TXT',
  "UBICACION": 'NA',
  "to": data.to,
  "NOMBRE": 'SEGUCOM SISTEMA CONTROL'
    }
    io.emit('receiveMessage', messa);
    
    return res.status(200).json({ message: 'Notificacion enviada correctamente' });
  }

}
);
/*
{
  "type": "CONSIGNA",
  "listaElementos": [80000, 80100]
}

{
  "type": "BOLETIN",
  "listaElementos": [80000, 80100]
}
*/



//Endpoint para enviar notificacion de una consigna
//--------------------------------------------------------------------------------------------------------> SOCKET.IO
let users = {};
let groups = {};
let chatRooms = {}; // Este objeto almacenará el estado de los chats
let pendingOffers = {}; // Almacena las ofertas de llamadas pendientes

 // Enviar estadísticas al cliente cada 2 segundos
 setInterval(async () => {
  await serverStats.updateStats();
  io.emit('serverStats', serverStats);
}, 2000);


// INICIO DEL SOCKET.IO
io.on('connection', (socket) => {
   


  console.log('Usuario conectado:', socket.id);

  // Manejo del evento 'setId' recibido desde el cliente
  socket.on('setId', (id) => {
    users[id] = socket.id;
    console.log(`User ID set: ${id}`);
  });





  //////////////////////////////////////////// join sala de 1 a 1
  // Manejo del evento 'joinChat'
  // Manejo del evento 'joinChat'
  // Manejo del evento 'joinChat'
  socket.on('joinChat', (data) => {
    const userId1 = data.userId1;
    const userId2 = data.userId2;

    // Ordena los IDs para crear una clave única
    const chatKey = [userId1, userId2].sort().join('-'); // Genera una clave única para la sala

    console.log('\n-----------------------------');
    console.log(`Usuario ${userId1} intenta unirse al chat con ${userId2}.`);
    console.log(`Clave de chat generada: ${chatKey}`);

    // Verifica si la sala de chat ya existe, si no, la crea
    if (!chatRooms[chatKey]) {
      chatRooms[chatKey] = {
        [userId1]: 'connected',
        [userId2]: 'disconnected' // Suponiendo que solo uno está conectado inicialmente
      };
      console.log(`Sala de chat creada: ${chatKey}`);
    } else {
      // Asegúrate de que ambos usuarios estén en la sala y actualiza su estado
      chatRooms[chatKey][userId1] = 'connected'; // Marca al usuario que se une como conectado
      console.log(`Sala de chat existente: ${chatKey}. Actualizando estado de ${userId1} a 'connected'.`);
    }

    console.log(`Estado actual del chat ${chatKey}:`, chatRooms[chatKey]);

    // Notifica a los usuarios del estado del chat
    const otherUserId = userId1 === userId2 ? userId1 : userId2; // Cambia según tu lógica
    socket.to(users[otherUserId]).emit('chatStatusUpdate', chatRooms[chatKey]);
    console.log(`Notificación enviada a ${otherUserId} sobre el estado del chat:`, chatRooms[chatKey]);
    console.log('\n-----------------------------');
  });

  // Manejo del evento 'leaveChat' para salir de la sala
  socket.on('leaveChat', (data) => {
    const userId = data.userId;
    const chatId = data.chatId;
    const chatKey = [userId, chatId].sort().join('-'); // Genera la clave de la sala de chat

    console.log(`Usuario ${userId} se ha desconectado de la sala ${chatKey}.`);

    // Actualiza el estado en chatRooms
    if (chatRooms[chatKey] && chatRooms[chatKey][userId]) {
      chatRooms[chatKey][userId] = 'disconnected'; // Actualiza el estado del usuario a desconectado

      // Imprime el estado actual de la sala después de la desconexión
      console.log(`Estado actual del chat ${chatKey} después de la desconexión:`, chatRooms[chatKey]);

      // Verifica si ambos usuarios están desconectados y elimina la sala
      const otherUserId = Object.keys(chatRooms[chatKey]).find(id => id !== userId);
      if (chatRooms[chatKey][otherUserId] === 'disconnected') {
        delete chatRooms[chatKey]; // Elimina la sala
        console.log(`Sala ${chatKey} eliminada porque ambos usuarios están desconectados.`);
      }
    }
  });



  //////////////////////////////////////////// finjoin sala de 1 a 1



  // Manejo del evento 'joinGroup' para añadir usuarios a grupos
  socket.on('joinGroup', (groupId, userId) => {
    if (!groups[groupId]) {
      groups[groupId] = [];
    }
    if (!groups[groupId].includes(userId)) {
      groups[groupId].push(userId);
    }
    console.log(`User ${userId} joined group ${groupId}`);
  });

  // Manejo del evento 'sendMessage' recibido desde el cliente
  /*
  socket.on('sendMessage', (newMessage) => {
    console.log('Nuevo mensaje enviado:', newMessage.MENSAJE);
    // Procesa el mensaje y emite a todos los clientes conectados
    io.emit('receiveMessage', newMessage);
  });
*/

  // ///////////////////////////////////////////////////////////////////////////// -> MENSAJES
  // Manejo del evento 'sendMessage' recibido desde el cliente
  // Manejo del evento 'sendMessage' recibido desde el cliente
  socket.on('sendMessage', (newMessage) => {
    console.log('Nuevo mensaje enviado:', newMessage);
    
   
  //io.emit('receiveMessage', newMessage);
  //console.log('Nuevo mensaje enviado:', newMessage);
   //socket.emit('notificarAsignacion', datos);
    //console.log('Notificacion de boletin enviada');
    io.emit('receiveMessage', newMessage);


    const targetSocketId = users[newMessage.to]; // ID del destinatario para chats 1 a 1
    if (newMessage.to) {
      // Chat 1 a 1
      if (targetSocketId) {
        socket.to(targetSocketId).emit('receiveMessage', newMessage);
        console.log(`Nuevo mensaje enviado a ${newMessage.to}: ${newMessage.MENSAJE}`);
      } else {
        console.log(`No se encontró el usuario con ID: ${newMessage.to}`);
      }
    } else if (newMessage.groupId) {
      // Chat grupal
      const groupMembers = groups[newMessage.groupId];
      if (groupMembers) {
        groupMembers.forEach((memberId) => {
          const memberSocketId = users[memberId];
          if (memberSocketId) {
            console.log(newMessage);
            socket.to(memberSocketId).emit('receiveMessage', newMessage);

          }
        });
        console.log(`Nuevo mensaje enviado al grupo ${newMessage.groupId}: ${newMessage.MENSAJE}`);
      } else {
        console.log(`No se encontró el grupo con ID: ${newMessage.groupId}`);
      }
    }

    
  });






  //-------------------------------------------------------------> LLAMADAS Y VIDEOLLAMADAS 

  // Dentro de tu evento 'offer'
  socket.on('offer', async (data) => {
    const targetSocketId = users[data.to];
    const callerId = data.me;
    const chatKey = [callerId, data.to].sort().join('-');

    // Verifica si ambos usuarios están conectados en la sala de chat
    if (chatRooms[chatKey] && chatRooms[chatKey][callerId] === 'connected' && chatRooms[chatKey][data.to] === 'connected') {
        if (targetSocketId) {
            io.to(targetSocketId).emit('offer', {
                sdp: data.sdp,
                type: data.type,
                isVideoCall: data.isVideoCall,
                callerName: data.callerName,
                callerNumber: data.callerNumber,
            });
            console.log(`Offer sent from ${data.callerName} (${data.callerNumber}) to ${data.to} - Video Call: ${data.isVideoCall}`);
        }
    } else {
        console.log(`No se puede realizar la llamada, uno o ambos usuarios no están conectados en la sala: ${chatKey}`);

        // Invocar el endpoint para notificar sobre la llamada
        try {
            const elemento = data.to;
            const callData = {
                from: callerId,
                type: data.isVideoCall ? 'video' : 'voice',
                callerName: data.callerName,
                to: elemento.toString(),
                
            };
            console.log('Enviando notificación de llamada:', callData);
            await axios.post(`https://segubackend.com/test-call-request/`, callData);
            console.log(`Notificación de llamada enviada a  ${data.to} porque no está conectado, de parte de (${data.callerNumber})`);
        } catch (error) {
            console.error('Error al invocar el endpoint:', error.message);
        }

        // Almacena la oferta de llamada
        pendingOffers[chatKey] = data; // Suponiendo que pendingOffers es un objeto global

        // Inicia un intervalo para revisar la conexión del usuario llamado
        const checkInterval = setInterval(() => {
            const isConnected = chatRooms[chatKey] && chatRooms[chatKey][data.to] === 'connected';
            if (isConnected) {
                clearInterval(checkInterval); // Detén el intervalo si el usuario está conectado
                const storedOffer = pendingOffers[chatKey]; // Recupera la oferta almacenada
                if (storedOffer) {
                    if (targetSocketId) {
                        io.to(targetSocketId).emit('offer', {
                            sdp: storedOffer.sdp,
                            type: storedOffer.type,
                            isVideoCall: storedOffer.isVideoCall,
                            callerName: storedOffer.callerName,
                            callerNumber: storedOffer.callerNumber,
                        });
                        console.log(`Offer sent to ${data.to} después de la reconexión`);
                    }
                    delete pendingOffers[chatKey]; // Limpia la oferta almacenada
                }
            }
        }, 3000); // Revisar cada segundo
    }
});


  //DSAD



  socket.on('answer', (data) => {
    const targetSocketId = users[data.to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('answer', {
        sdp: data.sdp,
        type: data.type,
      });
      console.log(`Answer sent to ${data.to}`);
    }
  });

  socket.on('candidate', (data) => {
    const targetSocketId = users[data.to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('candidate', {
        candidate: data.candidate,
        sdpMid: data.sdpMid,
        sdpMLineIndex: data.sdpMLineIndex,
      });
    }
  });


  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);

    let disconnectedUserId;

    // Busca el ID del usuario que se desconecta
    for (let id in users) {
      if (users[id] === socket.id) {
        disconnectedUserId = id;
        delete users[id]; // Elimina el usuario de la lista de usuarios conectados
        break;
      }
    }

    // También eliminar el usuario de todos los grupos
    for (let groupId in groups) {
      groups[groupId] = groups[groupId].filter((userId) => userId !== socket.id);
    }

    // Actualiza el estado en chatRooms para los chats en los que estaba el usuario desconectado
    for (let chatKey in chatRooms) {
      if (chatRooms[chatKey][disconnectedUserId]) {
        chatRooms[chatKey][disconnectedUserId] = 'disconnected'; // Actualiza el estado del usuario desconectado

        // Verifica si ambos usuarios están desconectados
        const otherUserId = Object.keys(chatRooms[chatKey]).find(id => id !== disconnectedUserId);
        if (chatRooms[chatKey][otherUserId] === 'disconnected') {
          // Ambos usuarios están desconectados, elimina la sala
          delete chatRooms[chatKey];
          console.log(`Sala ${chatKey} eliminada porque ambos usuarios están desconectados.`);
        }
      }
    }

    console.log('Estado actualizado de las salas:', chatRooms);
  });




  socket.on('panicoAlerta', (data) => {
    console.log('Usuario conectado en alerta:', data);
  });

  socket.on('notificarAsignacion', (data) => {
    console.log('asignacion recibida en socket:', data);
  });

  socket.on('notifyRequestCall', (data) => {
    console.log('Emitiendo solicitud de llamada', data);
  });


 
  
});
//-------------------------------------------------------------> LLAMADAS Y VIDEOLLAMADAS

//verificar si están en la sala de chat
// Endpoint para verificar el estado de conexión de dos usuarios en su chatroom

app.post('/check-chatroom-status/:usuario/:destinatario', (req, res) => {
  const userId1 = req.params.usuario;
  const userId2 = req.params.destinatario;

  // Ordena los IDs para crear una clave única
  const chatKey = [userId1, userId2].sort().join('-');

  console.log(`Verificando estado de la sala de chat para ${userId1} y ${userId2} con clave ${chatKey}.`);

  if (chatRooms[chatKey] && chatRooms[chatKey][userId1] === 'connected' && chatRooms[chatKey][userId2] === 'connected') {
      console.log(`Ambos usuarios (${userId1} y ${userId2}) están conectados en la sala ${chatKey}.`);
      res.status(200).send({ message: 'Ambos usuarios están conectados en la sala de chat.' });
  } else {
      console.log(`Uno o ambos usuarios (${userId1} y ${userId2}) no están conectados en la sala ${chatKey}.`);
      res.status(400).send({ message: 'Uno o ambos usuarios no están conectados en la sala de chat.' });
  }
});

//test enviar request de call para emitir al notifyRequestCall
app.post('/test-call-request/', (req, res) => {

  const callData = req.body;

  // Utiliza JSON.stringify para imprimir el objeto correctamente
  console.log('Enviando solicitud de llamada: ' + JSON.stringify(callData));

  // Emite el evento a la persona llamada
  io.emit('notifyRequestCall', callData);

  res.send('Solicitud de llamada enviada correctamente');
});


//endpoint para obtener los miembros del grupo getMembers
app.get('/segucomunication/api/members/:idGrupo', async (req, res) => {
  const idGrupo = req.params.idGrupo;
  console.log('Obteniendo miembros del grupo: ' + idGrupo);
  getMembers(req, res, idGrupo);
});


//endpoint para con el elemento, obtener la lista de ids de grupo getIDsGroupsByElement
app.get('/segucomunication/api/groups/getID/:numElemento', async (req, res) => {
  const numElemento = req.params.numElemento;
  console.log('Obteniendo grupos del elemento: ' + numElemento);
  getIDsGroupsByElement(req, res, numElemento);
});
// Ruta de ejemplo
app.get('/test', (req, res) => {
  console.log('¡Hola, mundo BACKEND COMMUNICATION!');
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

app.get('/', (req, res) => {
  res.send('Backend raiz communication');
});

// --------------------------------------------------------- ENDPOINTS PARA ESTADISTICAS
// credenciales para acceder a las estadisticas
app.post('/server/credentials/user/access/:user/:pass', (req, res) => {
  const user = req.params.user;
  const pass = req.params.pass;
  console.log('Credenciales recibidas:', user, pass);

  if (user === 's3guc0m' && pass === 'JNbgrII3MSBGfsrvhbdeim@') {
    res.status(200).send('Credenciales correctas');
  } else {
    res.status(401).send('Credenciales incorrectas');
  }
});

//reinicio de servidor
app.post('/reboot/confirm/server', (req, res) => {
  // Envía una respuesta inmediata
  res.status(200).send('Servidor reiniciándose...');
  // Luego ejecuta el comando de reinicio
  exec('sudo reboot', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al ejecutar reboot: ${error.message}`);
      // Aquí podrías hacer un logging adicional si es necesario
      return; // No enviamos una respuesta aquí, ya que ya se envió
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      // Similarmente, puedes hacer logging, pero no enviamos respuesta
      return;
    }

    console.log(`stdout: ${stdout}`);
    // No se puede enviar una respuesta porque el servidor ya ha comenzado a reiniciarse
  });
});

// endpointd para reiniciar service:
// Función para manejar la ejecución de comandos de reinicio
function executeCommand(command, res) {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al ejecutar el comando: ${error.message}`);
      res.status(500).send(`Error al ejecutar el comando: ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      res.status(500).send(`Error: ${stderr}`);
      return;
    }

    console.log(`stdout: ${stdout}`);
    res.status(200).send(`Comando ejecutado con éxito: ${stdout}`);
  });
}

// Endpoint genérico para reiniciar servicios
app.post('/service/confirm/restart/:NAME', (req, res) => {
  const serviceName = req.params.NAME;

  let command = '';
  switch (serviceName) {
    case 'segucom-backend':
      command = 'sudo systemctl restart backendsegucom.service';
      break;
    case 'segucomunications':
      command = 'sudo systemctl restart segucomunication';
      break;
    case 'nginx':
      command = 'sudo systemctl restart nginx';
      break;
    case 'database':
      command = 'sudo systemctl restart mysqld.service';
      break;
    default:
      res.status(400).send('Servicio no válido');
      return;
  }

  // Ejecuta el comando correspondiente
  executeCommand(command, res);
});

// Función para manejar la ejecución de comandos de estado
function getServiceStatus(service, res) {
  const command = `sudo systemctl status ${service}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      // Si el servicio está detenido, `systemctl` genera un error, pero verificamos si es "inactive" para devolver 503
      if (stdout.includes('Active: inactive') || stderr.includes('inactive (dead)')) {
        console.log(`El servicio ${service} está detenido`);
        res.status(503).send(`El servicio ${service} está detenido.`);
      } else if (stderr.includes('Loaded: not-found')) {
        console.log(`El servicio ${service} no existe`);
        res.status(404).send(`El servicio ${service} no existe.`);
      } else {
        // Si es otro tipo de error no relacionado con el estado del servicio
        console.error(`Error al ejecutar el comando: ${error.message}`);
        res.status(500).send(`Error al ejecutar el comando: ${error.message}`);
      }
      return;
    }

    // Si no hay error, verificamos si el servicio está corriendo
    if (stdout.includes('Active: active (running)')) {
      console.log(`El servicio ${service} está en ejecución`);
      res.status(200).send(`El servicio ${service} está en ejecución.`);
    } else {
      console.log(`Estado desconocido del servicio ${service}`);
      res.status(500).send(`Estado desconocido del servicio ${service}.`);
    }
  });
}

// Endpoint para obtener el estado de un servicio
app.get('/service/confirm/status/:NAME', (req, res) => {
  
  const serviceName = req.params.NAME;

  let service = '';
  switch (serviceName) {
    case 'segucom-backend':
      service = 'backendsegucom.service';
      break;
    case 'segucomunications':
      service = 'segucomunication';
      break;
    case 'nginx':
      service = 'nginx';
      break;
    case 'database':
      service = 'mysqld.service';
      break;
    default:
      res.status(400).send('Servicio no válido');
      return;
  }

  // Obtiene el estado del servicio correspondiente
  getServiceStatus(service, res);
});


// Iniciar el servidor HTTPS
server.listen(port, () => {
  console.log(`Servidor HTTPS corriendo en https://0.0.0.0:${port}`);
});