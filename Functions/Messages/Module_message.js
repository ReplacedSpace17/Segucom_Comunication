const { db_segucom: db_communication } = require('../../SQL_CONNECTION');

async function sendMessage(req, res) {
    const { senderId, recipientId, content } = req.body;

    const script = `
        INSERT INTO MESSAGES (SENDER_ID, RECIPIENT_ID, CONTENT)
        VALUES (?, ?, ?)
    `;

    try {
        const [result] = await db_communication.promise().query(script, [senderId, recipientId, content]);
        res.status(200).json({ message: 'Message sent', messageId: result.insertId });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Server error sending message' });
    }
}

async function getMessages(req, res) {
    const { senderId, recipientId } = req.query;

    const script = `
        SELECT * FROM MESSAGES
        WHERE (SENDER_ID = ? AND RECIPIENT_ID = ?) OR (SENDER_ID = ? AND RECIPIENT_ID = ?)
        ORDER BY TIMESTAMP
    `;

    try {
        const [results] = await db_communication.promise().query(script, [senderId, recipientId, recipientId, senderId]);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ error: 'Server error getting messages' });
    }
}

async function reactToMessage(req, res) {
    const { messageId, elementoId, reactionType } = req.body;

    const script = `
        INSERT INTO REACCTIONS (MESSAGE_ID, ELEMENTO_ID, REACTION_TYPE)
        VALUES (?, ?, ?)
    `;

    try {
        const [result] = await db_communication.promise().query(script, [messageId, elementoId, reactionType]);
        res.status(200).json({ message: 'Reaction added', reactionId: result.insertId });
    } catch (error) {
        console.error('Error adding reaction:', error);
        res.status(500).json({ error: 'Server error adding reaction' });
    }
}


async function getReactions(req, res) {
    const { messageId } = req.query;

    const script = `
        SELECT * FROM REACTIONS
        WHERE MESSAGE_ID = ?
    `;

    try {
        const [results] = await db_communication.promise().query(script, [messageId]);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error getting reactions:', error);
        res.status(500).json({ error: 'Server error getting reactions' });
    }
}

module.exports = {
    sendMessage,
    getMessages,
    reactToMessage,
    getReactions
};


