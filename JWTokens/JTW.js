// Importa la librería jsonwebtoken
const jwt = require('jsonwebtoken');

// Función para generar un token JWT
function generateToken(userId) {
  // Define la clave secreta para firmar el token (asegúrate de que sea segura y no la compartas)
  const secretKey = 'tu_clave_secreta';

  // Genera el token con el userId y la clave secreta
  const token = jwt.sign({ userId }, secretKey, { expiresIn: '1h' }); // El token expira en 1 hora

  return token;
}

module.exports = { generateToken };
