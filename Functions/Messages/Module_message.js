const { db_segucom, db_communication } = require('../../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');

async function sendMessage(req, res, emisor, data) {


    // Validar longitud del mensaje
    const msj= data.MENSAJE;
    if (msj.length > 150) {
        return res.status(400).json({ error: 'El mensaje excede el límite de 150 caracteres' });
    }

    const script = `
        INSERT INTO MENSAJE_ELEMENTO (MENELEM_FEC, ELEMENTO_SEND, ELEMENTO_RECIBE, MENELEM_TEXTO, MENELEM_MEDIA)
        VALUES (?, ?, ?, ?, ?)
    `;

    try {
        const [result] = await db_communication.promise().query(script, [data.FECHA, emisor, data.RECEPTOR, data.MENSAJE, data.MEDIA]);
        res.status(200).json({ message: 'Message sent', messageId: result.insertId });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Server error sending message' });
    }
}

async function receiveMessages(req, res, numTel) {
    const script = `
        SELECT 
            m.MENELEM_ID,
            m.MENELEM_FEC,
            m.ELEMENTO_SEND,
            m.ELEMENTO_RECIBE,
            m.MENELEM_TEXTO,
            m.MENELEM_MEDIA,
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
            LEFT JOIN segucomm_db.ELEMENTO es ON m.ELEMENTO_SEND = es.ELEMENTO_TELNUMERO
            LEFT JOIN segucomm_db.ELEMENTO er ON m.ELEMENTO_RECIBE = er.ELEMENTO_TELNUMERO
        WHERE 
            m.ELEMENTO_SEND = ? OR m.ELEMENTO_RECIBE = ?
        ORDER BY 
            m.MENELEM_FEC ASC
    `;

    try {
        const [rows] = await db_communication.promise().query(script, [numTel, numTel]);

        // Agrupar y formatear los datos
        const groupedMessages = rows.reduce((acc, message) => {
            const contactNum = message.ELEMENTO_SEND === parseInt(numTel) ? message.ELEMENTO_RECIBE : message.ELEMENTO_SEND;
            const contactName = message.ELEMENTO_SEND === parseInt(numTel)
                ? `${message.RECIBE_NOMBRE} ${message.RECIBE_PATERNO} ${message.RECIBE_MATERNO}`
                : `${message.SEND_NOMBRE} ${message.SEND_PATERNO} ${message.SEND_MATERNO}`;
            const contactTel = message.ELEMENTO_SEND === parseInt(numTel) ? message.RECIBE_TELNUMERO : message.SEND_TELNUMERO;

            if (!acc[contactNum]) {
                acc[contactNum] = {
                    ELEMENTO_NUM: contactNum,
                    NOMBRE_COMPLETO: contactName,
                    TELEFONO: contactTel,
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

        res.status(200).json(result);
    } catch (error) {
        console.error('Error receiving messages:', error);
        res.status(500).json({ error: 'Server error receiving messages' });
    }
}

async function receiveMessagesByChat(req, res, numTel1, numTel2) {
    const script = `
        SELECT 
            m.MENELEM_ID,
            m.MENELEM_FEC,
            m.ELEMENTO_SEND,
            m.ELEMENTO_RECIBE,
            m.MENELEM_TEXTO,
            m.MENELEM_MEDIA,
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
            LEFT JOIN segucomm_db.ELEMENTO es ON m.ELEMENTO_SEND = es.ELEMENTO_TELNUMERO
            LEFT JOIN segucomm_db.ELEMENTO er ON m.ELEMENTO_RECIBE = er.ELEMENTO_TELNUMERO
        WHERE 
            (m.ELEMENTO_SEND = ? AND m.ELEMENTO_RECIBE = ?) OR 
            (m.ELEMENTO_SEND = ? AND m.ELEMENTO_RECIBE = ?)
        ORDER BY 
            m.MENELEM_FEC ASC
    `;

    try {
        const [rows] = await db_communication.promise().query(script, [numTel1, numTel2, numTel2, numTel1]);

        const result = rows.map(message => ({
            MENSAJE_ID: message.MENELEM_ID,
            FECHA: message.MENELEM_FEC,
            REMITENTE: message.ELEMENTO_SEND,
            RECEPTOR: message.ELEMENTO_RECIBE,
            NOMBRE_REMITENTE: message.ELEMENTO_SEND === numTel1 
                ? `${message.SEND_NOMBRE} ${message.SEND_PATERNO} ${message.SEND_MATERNO}`
                : `${message.RECIBE_NOMBRE} ${message.RECIBE_PATERNO} ${message.RECIBE_MATERNO}`,
            MENSAJE: message.MENELEM_TEXTO,
            MEDIA: message.MENELEM_MEDIA
        }));

        res.status(200).json(result);
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
