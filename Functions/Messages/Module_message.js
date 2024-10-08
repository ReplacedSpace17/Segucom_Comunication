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

async function getMessagesIfExists(req, res, emisor, receptor) {
    const script = `
        SELECT 
            m.*
        FROM 
            MENSAJE_ELEMENTO m
        WHERE 
            (m.ELEMENTO_SEND = ? AND m.ELEMENTO_RECIBE = ?) OR 
            (m.ELEMENTO_SEND = ? AND m.ELEMENTO_RECIBE = ?)
        ORDER BY 
            m.MENELEM_FEC ASC
    `;

    try {
        const [rows] = await db_communication.promise().query(script, [emisor, receptor, receptor, emisor]);

        // Crear un objeto para el contacto
        const result = [{
            ELEMENTO_NUM: receptor,
            NOMBRE_COMPLETO: null,
            TELEFONO: null,
            MENSAJES: []
        }];

        // Si hay mensajes, agruparlos
        if (rows.length > 0) {
            rows.forEach(message => {
                result[0].MENSAJES.push({
                    MENSAJE_ID: message.MENELEM_ID,
                    VALUE: message.MENELEM_TEXTO,
                    REMITENTE: message.ELEMENTO_SEND,
                    FECHA: message.MENELEM_FEC
                });
            });
        }

        // Obtener información adicional del contacto receptor
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
                ELEMENTO_NUMERO = ?
        `;

        const [elementosRows] = await db_segucom.promise().query(elementosQuery, [receptor]);

        // Actualizar la información del contacto en el resultado
        if (elementosRows.length > 0) {
            const elemento = elementosRows[0];
            result[0].NOMBRE_COMPLETO = `${elemento.ELEMENTO_NOMBRE} ${elemento.ELEMENTO_PATERNO} ${elemento.ELEMENTO_MATERNO}`.trim();
            result[0].TELEFONO = elemento.ELEMENTO_TELNUMERO;
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ error: 'Server error getting messages' });
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
async function GetMessagesByGroup(req, res, numeroElemento) {
    const script = `
        SELECT 
            mg.MMS_ID,
            mg.MMS_FEC,
            mg.MMS_TXT,
            mg.MMS_IMG,
            mg.MMS_OK,
            mg.MMS_MEDIA,
            mg.MMS_UBICACION,
            gm.GRUPO_ID,
            gm.GRUPO_DESCRIP,
            e.ELEMENTO_NUMERO,
            e.ELEMENTO_NOMBRE,
            e.ELEMENTO_PATERNO,
            e.ELEMENTO_MATERNO,
            e.ELEMENTO_TELNUMERO
        FROM 
            GRUPO_ELEMENTOS ge
            JOIN GRUPO_MMS gm ON ge.GRUPO_ID = gm.GRUPO_ID
            LEFT JOIN MENSAJE_GRUPO mg ON gm.GRUPO_ID = mg.GRUPO_ID
            JOIN segucomm_db.ELEMENTO e ON e.ELEMENTO_NUMERO = ge.ELEMENTO_NUMERO
        WHERE 
            ge.ELEMENTO_NUMERO = ?
            AND ge.ELEMGPO_ESTATUS = 1
            AND gm.GRUPO_ESTATUS = 1;
    `;

    try {
        const [rows] = await db_communication.promise().query(script, [numeroElemento]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron mensajes para el grupo.' });
        }

        const groups = {};

        rows.forEach(message => {
            const groupId = message.GRUPO_ID;

            // Si el grupo no existe en el objeto groups, lo inicializamos
            if (!groups[groupId]) {
                groups[groupId] = {
                    ELEMENTO_NUM: message.ELEMENTO_NUMERO,
                    NOMBRE_COMPLETO: `${message.ELEMENTO_NOMBRE} ${message.ELEMENTO_PATERNO} ${message.ELEMENTO_MATERNO}`.trim(),
                    TELEFONO: message.ELEMENTO_TELNUMERO,
                    GRUPO_ID: groupId,
                    GRUPO_DESCRIP: message.GRUPO_DESCRIP,
                    MENSAJES: []
                };
            }

            // Solo agregar mensajes si existen
            if (message.MMS_ID) {
                groups[groupId].MENSAJES.push({
                    MENSAJE_ID: message.MMS_ID,
                    MENSAJE: message.MMS_TXT,
                    REMITENTE: message.ELEMENTO_NUMERO,
                    FECHA: moment.utc(message.MMS_FEC).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss'),
                    MMS_IMG: message.MMS_IMG,
                    MMS_OK: message.MMS_OK,
                    MEDIA: message.MMS_MEDIA,
                    UBICACION: message.MMS_UBICACION
                });
            }
        });

        // Convertir el objeto groups en un array
        const result = Object.values(groups);
        res.status(200).json(result); // Enviamos el resultado
    } catch (error) {
        console.error('Error fetching messages by group:', error);
        res.status(500).json({ error: 'Server error fetching messages by group' });
    }
}



async function GetMessagesFromGroupSpecific(req, res, idGrupo) {
    const script = `
        SELECT 
            mg.MMS_ID,
            mg.MMS_FEC,
            mg.MMS_TXT,
            mg.MMS_IMG,
            mg.MMS_OK,
            mg.MMS_MEDIA,
            mg.MMS_UBICACION,
            mg.ELEMENTO_NUMERO,
            gm.GRUPO_ID,
            gm.GRUPO_DESCRIP,
            e.ELEMENTO_NOMBRE AS REMITENTE_NOMBRE,
            e.ELEMENTO_PATERNO AS REMITENTE_PATERNO,
            e.ELEMENTO_MATERNO AS REMITENTE_MATERNO,
            e.ELEMENTO_TELNUMERO AS REMITENTE_TELNUMERO,
            ge.ELEMGPO_ID
        FROM 
            GRUPO_ELEMENTOS ge
            JOIN GRUPO_MMS gm ON ge.GRUPO_ID = gm.GRUPO_ID
            JOIN MENSAJE_GRUPO mg ON gm.GRUPO_ID = mg.GRUPO_ID
            JOIN segucomm_db.ELEMENTO e ON e.ELEMENTO_NUMERO = mg.ELEMENTO_NUMERO
        WHERE 
            gm.GRUPO_ID = ?
            AND ge.ELEMGPO_ESTATUS = 1
            AND gm.GRUPO_ESTATUS = 1;
    `;

    try {
        const [rows] = await db_communication.promise().query(script, [idGrupo]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron mensajes para el grupo.' });
        }

        const groupInfo = {
            ELEMENTO_NUM: rows[0].ELEMENTO_NUMERO,
            NOMBRE_COMPLETO: `${rows[0].ELEMENTO_NOMBRE} ${rows[0].ELEMENTO_PATERNO} ${rows[0].ELEMENTO_MATERNO}`.trim(),
            TELEFONO: rows[0].ELEMENTO_TELNUMERO,
            GRUPO_ID: rows[0].GRUPO_ID,
            GRUPO_DESCRIP: rows[0].GRUPO_DESCRIP,
            MENSAJES: {}
        };

        rows.forEach(message => {
            const mensajeId = message.MMS_ID;
            if (!groupInfo.MENSAJES[mensajeId]) {
                groupInfo.MENSAJES[mensajeId] = {
                    MENSAJE_ID: message.MMS_ID,
                    MENSAJE: message.MMS_TXT,
                    NOMBRE: message.REMITENTE_NOMBRE,
                    REMITENTE: message.ELEMENTO_NUMERO,
                   
                    FECHA: moment.utc(message.MMS_FEC).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss'),
                    //MMS_IMG: message.MMS_IMG,
                    //MMS_OK: message.MMS_OK,
                    MEDIA: message.MMS_MEDIA,
                    UBICACION: message.MMS_UBICACION
                };
            }
        });

        // Convertimos el objeto MENSAJES de nuevo a un array
        groupInfo.MENSAJES = Object.values(groupInfo.MENSAJES);

        res.status(200).json(groupInfo); // Devolvemos directamente groupInfo
    } catch (error) {
        console.error('Error fetching messages by group:', error);
        res.status(500).json({ error: 'Error del servidor al obtener mensajes del grupo.' });
    }
}

async function sendMessageGroups(req, res, emisor, data) {
    // Validar longitud del mensaje (puedes adaptar la validación según los campos de MENSAJE_GRUPO)
    const mensaje = data.MMS_TXT || '';
    if (mensaje.length > 150) {
        return res.status(400).json({ error: 'El mensaje excede el límite de 150 caracteres' });
    }

    // Consulta SQL para insertar mensaje en MENSAJE_GRUPO
    const script = `
        INSERT INTO MENSAJE_GRUPO (MMS_FEC, MMS_TXT, MMS_IMG, MMS_OK, MMS_MEDIA, MMS_UBICACION, ELEMENTO_NUMERO, GRUPO_ID)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        // Ejecutar la consulta SQL con los datos proporcionados
        const [result] = await db_communication.promise().query(script, [
            data.FECHA,
            data.MENSAJE,
            "NA",
            "NA",
            data.MEDIA,
            data.UBICACION,
            emisor,
            data.GRUPO_ID
        ]);

        // Devolver respuesta exitosa con el ID del mensaje insertado
        res.status(200).json({ message: 'Message sent', messageId: result.insertId });
    } catch (error) {
        // Manejar errores de base de datos
        console.error('Error sending message to group:', error);
        res.status(500).json({ error: 'Server error sending message to group' });
    }
}


async function getMembers(req, res, idGrupo) {
    // Script para obtener los números de los elementos del grupo
    const getGroupElementsScript = `
        SELECT 
            ELEMENTO_NUMERO
        FROM 
            GRUPO_ELEMENTOS
        WHERE 
            GRUPO_ID = ?
            AND ELEMGPO_ESTATUS = 1;
    `;

    // Script para obtener detalles del elemento
    const getElementDetailsScript = `
        SELECT 
            ELEMENTO_NUMERO,
            ELEMENTO_NOMBRE,
            ELEMENTO_PATERNO,
            ELEMENTO_MATERNO
        FROM 
            ELEMENTO
        WHERE 
            ELEMENTO_NUMERO IN (?)
            AND ELEMENTO_ACTIVO = 1;
    `;

    try {
        // Obtener los números de los elementos del grupo
        const [groupElementRows] = await db_communication.promise().query(getGroupElementsScript, [idGrupo]);

        if (groupElementRows.length === 0) {
            return res.status(404).json({ message: 'No se encontraron elementos para el grupo especificado.' });
        }

        // Obtener los detalles de los elementos
        const elementNumbers = groupElementRows.map(row => row.ELEMENTO_NUMERO);

        // Verificar si hay números de elementos para consultar
        if (elementNumbers.length === 0) {
            return res.status(404).json({ message: 'No se encontraron números de elementos para el grupo especificado.' });
        }

        // Crear una consulta para obtener detalles de todos los números de elementos
        const [membersRows] = await db_segucom.promise().query(getElementDetailsScript, [elementNumbers]);

        // Depuración: imprimir resultados
        console.log('Detalles de elementos:', membersRows);

        // Combinar resultados
        const members = membersRows.map(row => ({
            ELEMENTO_NUMERO: row.ELEMENTO_NUMERO,
            NOMBRE_COMPLETO: `${row.ELEMENTO_NOMBRE || ''} ${row.ELEMENTO_PATERNO || ''} ${row.ELEMENTO_MATERNO || ''}`.trim()
        }));

        res.status(200).json(members);
    } catch (error) {
        console.error('Error fetching members by group:', error);
        res.status(500).json({ error: 'Error del servidor al obtener los miembros del grupo' });
    }
}



async function GetMessagesGroupWEB(req, res, numeroElemento, idGrupo) {
    const groupScript = `
        SELECT 
            ge.ELEMENTO_NUMERO,
            e.ELEMENTO_NOMBRE,
            e.ELEMENTO_PATERNO,
            e.ELEMENTO_MATERNO,
            e.ELEMENTO_TELNUMERO,
            gm.GRUPO_ID,
            gm.GRUPO_DESCRIP
        FROM 
            GRUPO_ELEMENTOS ge
            JOIN GRUPO_MMS gm ON ge.GRUPO_ID = gm.GRUPO_ID
            JOIN segucomm_db.ELEMENTO e ON e.ELEMENTO_NUMERO = ge.ELEMENTO_NUMERO
        WHERE 
            ge.ELEMENTO_NUMERO = ?
            AND gm.GRUPO_ID = ?
            AND ge.ELEMGPO_ESTATUS = 1
            AND gm.GRUPO_ESTATUS = 1;
    `;

    const messagesScript = `
        SELECT 
            mg.MMS_ID,
            mg.MMS_FEC,
            mg.MMS_TXT,
            mg.MMS_IMG,
            mg.MMS_OK,
            mg.MMS_MEDIA,
            mg.MMS_UBICACION,
            mg.ELEMENTO_NUMERO,
            e2.ELEMENTO_NOMBRE AS REMITENTE_NOMBRE,
            e2.ELEMENTO_PATERNO AS REMITENTE_PATERNO,
            e2.ELEMENTO_MATERNO AS REMITENTE_MATERNO
        FROM 
            MENSAJE_GRUPO mg
            JOIN segucomm_db.ELEMENTO e2 ON e2.ELEMENTO_NUMERO = mg.ELEMENTO_NUMERO
        WHERE 
            mg.GRUPO_ID = ?;
    `;

    try {
        const [groupRows] = await db_communication.promise().query(groupScript, [numeroElemento, idGrupo]);

        if (groupRows.length === 0) {
            return res.status(200).json({ message: 'No se encontró el grupo especificado para el elemento.' });
        }

        const groupInfo = {
            ELEMENTO_NUM: groupRows[0].ELEMENTO_NUMERO,
            NOMBRE_COMPLETO: `${groupRows[0].ELEMENTO_NOMBRE} ${groupRows[0].ELEMENTO_PATERNO} ${groupRows[0].ELEMENTO_MATERNO}`.trim(),
            TELEFONO: groupRows[0].ELEMENTO_TELNUMERO,
            GRUPO_ID: groupRows[0].GRUPO_ID,
            GRUPO_DESCRIP: groupRows[0].GRUPO_DESCRIP,
            MENSAJES: []
        };

        const [messageRows] = await db_communication.promise().query(messagesScript, [idGrupo]);

        messageRows.forEach(message => {
            groupInfo.MENSAJES.push({
                MENSAJE_ID: message.MMS_ID,
                MENSAJE: message.MMS_TXT,
                NOMBRE_REMITENTE: `${message.REMITENTE_NOMBRE} ${message.REMITENTE_PATERNO} ${message.REMITENTE_MATERNO}`.trim(),
                FECHA: moment.utc(message.MMS_FEC).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss'),
                MMS_IMG: message.MMS_IMG,
                MMS_OK: message.MMS_OK,
                MEDIA: message.MMS_MEDIA,
                UBICACION: message.MMS_UBICACION,
                ELEMENTO_NUMERO: message.ELEMENTO_NUMERO
            });
        });

        res.status(200).json([groupInfo]); // Envolvemos groupInfo en una lista
    } catch (error) {
        console.error('Error fetching messages by group:', error);
        res.status(500).json({ error: 'Server error fetching messages by group' });
    }
}


/* --------------------------------------- IMPORTANTE, OBTENER CHATS DE WEB, OLD
async function GetMessagesGroupWEB(req, res, numeroElemento) {
    const groupScript = `
        SELECT 
            ge.ELEMENTO_NUMERO,
            e.ELEMENTO_NOMBRE,
            e.ELEMENTO_PATERNO,
            e.ELEMENTO_MATERNO,
            e.ELEMENTO_TELNUMERO,
            gm.GRUPO_ID,
            gm.GRUPO_DESCRIP
        FROM 
            GRUPO_ELEMENTOS ge
            JOIN GRUPO_MMS gm ON ge.GRUPO_ID = gm.GRUPO_ID
            JOIN segucomm_db.ELEMENTO e ON e.ELEMENTO_NUMERO = ge.ELEMENTO_NUMERO
        WHERE 
            ge.ELEMENTO_NUMERO = ?
            AND ge.ELEMGPO_ESTATUS = 1
            AND gm.GRUPO_ESTATUS = 1;
    `;

    const messagesScript = `
        SELECT 
            mg.MMS_ID,
            mg.MMS_FEC,
            mg.MMS_TXT,
            mg.MMS_IMG,
            mg.MMS_OK,
            mg.MMS_MEDIA,
            mg.MMS_UBICACION,
            mg.ELEMENTO_NUMERO,
            e2.ELEMENTO_NOMBRE AS REMITENTE_NOMBRE,
            e2.ELEMENTO_PATERNO AS REMITENTE_PATERNO,
            e2.ELEMENTO_MATERNO AS REMITENTE_MATERNO
        FROM 
            MENSAJE_GRUPO mg
            JOIN segucomm_db.ELEMENTO e2 ON e2.ELEMENTO_NUMERO = mg.ELEMENTO_NUMERO
        WHERE 
            mg.GRUPO_ID = ?;
    `;

    try {
        const [groupRows] = await db_communication.promise().query(groupScript, [numeroElemento]);

        if (groupRows.length === 0) {
            return res.status(200).json({ message: 'No se encontraron grupos para el elemento.' });
        }

        const groupInfo = {
            ELEMENTO_NUM: groupRows[0].ELEMENTO_NUMERO,
            NOMBRE_COMPLETO: `${groupRows[0].ELEMENTO_NOMBRE} ${groupRows[0].ELEMENTO_PATERNO} ${groupRows[0].ELEMENTO_MATERNO}`.trim(),
            TELEFONO: groupRows[0].ELEMENTO_TELNUMERO,
            GRUPO_ID: groupRows[0].GRUPO_ID,
            GRUPO_DESCRIP: groupRows[0].GRUPO_DESCRIP,
            MENSAJES: []
        };

        const [messageRows] = await db_communication.promise().query(messagesScript, [groupRows[0].GRUPO_ID]);

        messageRows.forEach(message => {
            groupInfo.MENSAJES.push({
                MENSAJE_ID: message.MMS_ID,
                MENSAJE: message.MMS_TXT,
                NOMBRE_REMITENTE: `${message.REMITENTE_NOMBRE} ${message.REMITENTE_PATERNO} ${message.REMITENTE_MATERNO}`.trim(),
                FECHA: moment.utc(message.MMS_FEC).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss'),
                MMS_IMG: message.MMS_IMG,
                MMS_OK: message.MMS_OK,
                MEDIA: message.MMS_MEDIA,
                UBICACION: message.MMS_UBICACION,
                ELEMENTO_NUMERO: message.ELEMENTO_NUMERO
            });
        });

        res.status(200).json([groupInfo]); // Envolvemos groupInfo en una lista
    } catch (error) {
        console.error('Error fetching messages by group:', error);
        res.status(500).json({ error: 'Server error fetching messages by group' });
    }
}

*/




async function GetGroupsByElement(req, res, numeroElemento) {
    const script = `
        SELECT 
            gm.GRUPO_ID,
            gm.GRUPO_DESCRIP,
            gm.GRUPO_CLAVE,
            gm.GRUPO_FEC,
            gm.GRUPO_ESTATUS,
            gm.REGION_ID,
            gm.DIVISION_ID,
            e.ELEMENTO_NOMBRE,
            e.ELEMENTO_PATERNO,
            e.ELEMENTO_MATERNO
        FROM 
            GRUPO_ELEMENTOS ge
            JOIN GRUPO_MMS gm ON ge.GRUPO_ID = gm.GRUPO_ID
            JOIN segucomm_db.ELEMENTO e ON e.ELEMENTO_NUMERO = ge.ELEMENTO_NUMERO
        WHERE 
            ge.ELEMENTO_NUMERO = ?
            AND ge.ELEMGPO_ESTATUS = 1
            AND gm.GRUPO_ESTATUS = 1;
    `;

    try {
        const [rows] = await db_communication.promise().query(script, [numeroElemento]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron grupos para el elemento.' });
        }

        const groups = rows.map(group => ({
            GRUPO_ID: group.GRUPO_ID,
            GRUPO_DESCRIP: group.GRUPO_DESCRIP,
            GRUPO_CLAVE: group.GRUPO_CLAVE,
            GRUPO_FEC: group.GRUPO_FEC,
            GRUPO_ESTATUS: group.GRUPO_ESTATUS,
            REGION_ID: group.REGION_ID,
            DIVISION_ID: group.DIVISION_ID,
            ELEMENTO_NOMBRE: `${group.ELEMENTO_NOMBRE} ${group.ELEMENTO_PATERNO} ${group.ELEMENTO_MATERNO}`.trim(),
        }));

        res.status(200).json(groups);
    } catch (error) {
        console.error('Error fetching groups by element:', error);
        res.status(500).json({ error: 'Server error fetching groups by element' });
    }
}


async function GetNameRemitenteGroupChat(req, res, numeroElemento) {
    const script = `
        SELECT 
            e.ELEMENTO_NOMBRE,
            e.ELEMENTO_PATERNO,
            e.ELEMENTO_MATERNO
        FROM 
            segucomm_db.ELEMENTO e
        WHERE 
            e.ELEMENTO_NUMERO = ?
            AND e.ELEMENTO_ACTIVO = 1;  
    `;

    try {
        const [rows] = await db_communication.promise().query(script, [numeroElemento]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No se encontró el remitente con el número de elemento proporcionado.' });
        }

        const remitenteInfo = {
            NOMBRE_COMPLETO: `${rows[0].ELEMENTO_NOMBRE} ${rows[0].ELEMENTO_PATERNO} ${rows[0].ELEMENTO_MATERNO}`.trim()
        };

        res.status(200).json(remitenteInfo);
    } catch (error) {
        console.error('Error fetching remitente name:', error);
        res.status(500).json({ error: 'Error del servidor al obtener el nombre del remitente' });
    }
}



async function GetGroupIdsByElemento(req, res, numeroElemento) {
    const script = `
        SELECT DISTINCT 
            gm.GRUPO_ID
        FROM 
            GRUPO_ELEMENTOS ge
            JOIN GRUPO_MMS gm ON ge.GRUPO_ID = gm.GRUPO_ID
        WHERE 
            ge.ELEMENTO_NUMERO = ?
            AND ge.ELEMGPO_ESTATUS = 1
            AND gm.GRUPO_ESTATUS = 1;
    `;

    try {
        const [rows] = await db_communication.promise().query(script, [numeroElemento]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron grupos para el elemento.' });
        }

        const groupIds = rows.map(row => ({ "GroupID": row.GRUPO_ID }));

        res.status(200).json(groupIds);
    } catch (error) {
        console.error('Error fetching group IDs:', error);
        res.status(500).json({ error: 'Server error fetching group IDs' });
    }
}


async function getIDsGroupsByElement(req, res, numeroElemento) {
    const script = `
        SELECT 
            GRUPO_ID
        FROM 
            GRUPO_ELEMENTOS
        WHERE 
            ELEMENTO_NUMERO = ?
            AND ELEMGPO_ESTATUS = 1;
    `;

    try {
        const [rows] = await db_communication.promise().query(script, [numeroElemento]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron grupos activos para el elemento.' });
        }

        const groupIDs = rows.map(row => row.GRUPO_ID);

        res.status(200).json(groupIDs);
    } catch (error) {
        console.error('Error fetching group IDs by element:', error);
        res.status(500).json({ error: 'Server error fetching group IDs by element' });
    }
}


module.exports = {
    sendMessage,
    receiveMessages,
    receiveMessagesByChat,
    GetMessagesByGroup,
    GetMessagesFromGroupSpecific,
    sendMessageGroups,
    GetMessagesGroupWEB,
    GetNameRemitenteGroupChat,
    GetGroupsByElement,
    GetGroupIdsByElemento,
    getMessagesIfExists,
    getIDsGroupsByElement,
    getMembers
};
