const { db_segucom, db_communication } = require('../../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');

async function sendMessage(req, res, emisor, data) {


    // Validar longitud del mensaje
    const msj= data.MENSAJE;
    if (msj.length > 150) {
        return res.status(400).json({ error: 'El mensaje excede el límite de 150 caracteres' });
    }

    const script = `
        INSERT INTO MENSAJE_ELEMENTO (MENELEM_FEC, ELEMENTO_SEND, ELEMENTO_RECIBE, MENELEM_TEXTO, MENELEM_MEDIA, MENELEM_UBICACION)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
        const [result] = await db_communication.promise().query(script, [data.FECHA, emisor, data.RECEPTOR, data.MENSAJE, data.MEDIA, data.UBICACION]);
        console.log(data);
        res.status(200).json({ message: 'Message sent', messageId: result.insertId });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Server error sending message' });
    }
}

async function receiveMessages(req, res, numElemento) {
    const script = `
        SELECT 
            m.*
        FROM 
            MENSAJE_ELEMENTO m
        WHERE 
            m.ELEMENTO_SEND = ? OR m.ELEMENTO_RECIBE = ?
        ORDER BY 
            m.MENELEM_FEC ASC
    `;

    try {
        const [rows] = await db_communication.promise().query(script, [numElemento, numElemento]);

        // Agrupar los mensajes por contacto
        const groupedMessages = rows.reduce((acc, message) => {
            const contactNum = message.ELEMENTO_SEND === parseInt(numElemento) ? message.ELEMENTO_RECIBE : message.ELEMENTO_SEND;

            if (!acc[contactNum]) {
                acc[contactNum] = {
                    ELEMENTO_NUM: contactNum,
                    NOMBRE_COMPLETO: null,
                    TELEFONO: null,
                    MENSAJES: []
                };
            }

            acc[contactNum].MENSAJES.push({
                MENSAJE_ID: message.MENELEM_ID,
                VALUE: message.MENELEM_TEXTO,
                REMITENTE: message.ELEMENTO_SEND,
                FECHA: message.MENELEM_FEC
            });

            return acc;
        }, {});

        const result = Object.values(groupedMessages);

        // Obtener información adicional de los contactos
        const contactNumbers = result.map(r => r.ELEMENTO_NUM);
        if (contactNumbers.length > 0) {
            const placeholders = contactNumbers.map(() => '?').join(',');
            const elementosQuery = `
                SELECT 
                    ELEMENTO_NUMERO,
                    ELEMENTO_NOMBRE,
                    ELEMENTO_PATERNO,
                    ELEMENTO_MATERNO,
                    ELEMENTO_TELNUMERO
                FROM 
                    segucomm_db.ELEMENTO
                WHERE 
                    ELEMENTO_NUMERO IN (${placeholders})
            `;

            const [elementosRows] = await db_segucom.promise().query(elementosQuery, contactNumbers);

            // Actualizar la información de los contactos en el resultado
            elementosRows.forEach(elemento => {
                const index = result.findIndex(r => r.ELEMENTO_NUM === elemento.ELEMENTO_NUMERO);
                if (index !== -1) {
                    result[index].NOMBRE_COMPLETO = `${elemento.ELEMENTO_NOMBRE} ${elemento.ELEMENTO_PATERNO} ${elemento.ELEMENTO_MATERNO}`.trim();
                    result[index].TELEFONO = elemento.ELEMENTO_TELNUMERO;
                }
            });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error receiving messages:', error);
        res.status(500).json({ error: 'Server error receiving messages' });
    }
}
async function receiveMessagesByChat(req, res, numTel1, numTel2) {
    const script = `
        SELECT 
            m.*,
            es.ELEMENTO_NOMBRE AS SEND_NOMBRE,
            es.ELEMENTO_PATERNO AS SEND_PATERNO,
            es.ELEMENTO_MATERNO AS SEND_MATERNO,
            es.ELEMENTO_TELNUMERO AS SEND_TELNUMERO,
            er.ELEMENTO_NOMBRE AS RECIBE_NOMBRE,
            er.ELEMENTO_PATERNO AS RECIBE_PATERNO,
            er.ELEMENTO_MATERNO AS RECIBE_MATERNO,
            er.ELEMENTO_TELNUMERO AS RECIBE_TELNUMERO
        FROM 
            MENSAJE_ELEMENTO m
            LEFT JOIN segucomm_db.ELEMENTO es ON m.ELEMENTO_SEND = es.ELEMENTO_NUMERO
            LEFT JOIN segucomm_db.ELEMENTO er ON m.ELEMENTO_RECIBE = er.ELEMENTO_NUMERO
        WHERE 
            (m.ELEMENTO_SEND = ? AND m.ELEMENTO_RECIBE = ?) OR 
            (m.ELEMENTO_SEND = ? AND m.ELEMENTO_RECIBE = ?)
        ORDER BY 
            m.MENELEM_FEC ASC
    `;

    try {
        const [rows] = await db_communication.promise().query(script, [numTel1, numTel2, numTel2, numTel1]);

        // Obtener la información del remitente y del receptor si falta
        const uniqueElements = new Set();
        rows.forEach(message => {
            if (!message.SEND_NOMBRE || !message.RECIBE_NOMBRE) {
                uniqueElements.add(message.ELEMENTO_SEND);
                uniqueElements.add(message.ELEMENTO_RECIBE);
            }
        });

        const elementDetails = {};
        if (uniqueElements.size > 0) {
            const elementsQuery = `
                SELECT 
                    ELEMENTO_NUMERO,
                    ELEMENTO_NOMBRE,
                    ELEMENTO_PATERNO,
                    ELEMENTO_MATERNO,
                    ELEMENTO_TELNUMERO
                FROM 
                    segucomm_db.ELEMENTO
                WHERE 
                    ELEMENTO_NUMERO IN (${Array.from(uniqueElements).map(() => '?').join(',')})
            `;
            const [elementRows] = await db_segucom.promise().query(elementsQuery, Array.from(uniqueElements));
            elementRows.forEach(element => {
                elementDetails[element.ELEMENTO_NUMERO] = {
                    NOMBRE: `${element.ELEMENTO_NOMBRE} ${element.ELEMENTO_PATERNO} ${element.ELEMENTO_MATERNO}`.trim(),
                    TELEFONO: element.ELEMENTO_TELNUMERO
                };
            });
        }

        // Crear un objeto para almacenar la información del chat
        const chatInfo = {
            REMITENTE: rows[0].ELEMENTO_SEND,
            NOMBRE_REMITENTE: rows[0].SEND_NOMBRE
                ? `${rows[0].SEND_NOMBRE} ${rows[0].SEND_PATERNO} ${rows[0].SEND_MATERNO}`
                : elementDetails[rows[0].ELEMENTO_SEND].NOMBRE,
            TELEFONO_REMITENTE: rows[0].SEND_TELNUMERO
                ? rows[0].SEND_TELNUMERO
                : elementDetails[rows[0].ELEMENTO_SEND].TELEFONO,
            RECEPTOR: rows[0].ELEMENTO_RECIBE,
            NOMBRE_RECEPTOR: rows[0].RECIBE_NOMBRE
                ? `${rows[0].RECIBE_NOMBRE} ${rows[0].RECIBE_PATERNO} ${rows[0].RECIBE_MATERNO}`
                : elementDetails[rows[0].ELEMENTO_RECIBE].NOMBRE,
            TELEFONO_RECEPTOR: rows[0].RECIBE_TELNUMERO
                ? rows[0].RECIBE_TELNUMERO
                : elementDetails[rows[0].ELEMENTO_RECIBE].TELEFONO,
            MENSAJES: []
        };

        // Agregar los mensajes al array de mensajes del chat y ajustar las fechas
        rows.forEach(message => {
            chatInfo.MENSAJES.push({
                MENSAJE_ID: message.MENELEM_ID,
                FECHA: moment.utc(message.MENELEM_FEC).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss'),
                REMITENTE: message.ELEMENTO_SEND,
                MENSAJE: message.MENELEM_TEXTO,
                MEDIA: message.MENELEM_MEDIA,
                UBICACION: message.MENELEM_UBICACION
            });
        });

        res.status(200).json([chatInfo]);
    } catch (error) {
        console.error('Error receiving messages:', error);
        res.status(500).json({ error: 'Server error receiving messages' });
    }
}

module.exports = {
    sendMessage,
    receiveMessages,
    receiveMessagesByChat
};
