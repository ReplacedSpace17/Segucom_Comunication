const connection = require('../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');



const saltRounds = 10; // Número de rondas de sal para bcrypt, ajusta según sea necesario

async function Login(data) {
  const script = `
    SELECT 
      u.uid,
      u.email,
      u.password,
      u.activate,
      p.nombre,
      p.apellidop,
      p.apellidom,
      p.avatar
    FROM 
      users u
    INNER JOIN 
      personal_information p
    ON 
      u.uid = p.uid
    WHERE 
      u.email = $1
  `;

  try {
    const result = await connection.query(script, [data.Email]);

    if (result.rows.length > 0) {
      const storedHashedPassword = result.rows[0].password;
      const uid = result.rows[0].uid;
      // Comparar el hash almacenado con la contraseña ingresada
      const isPasswordMatch = await comparePasswords(data.Password, storedHashedPassword);
      if (isPasswordMatch) {
        // Las credenciales son válidas
        // Generar el token JWT
        const token = jwt.sign({ uid }, 'bioharvest', { expiresIn: '1h' }); // Token expira en 1 hora

        //construir el nombre y apellido paterno
        const nombreData = result.rows[0].nombre + ' ' + result.rows[0].apellidop;

        return { 
          success: true, 
          token, 
          email: data.Email, 
          nombre: nombreData,
          avatar: result.rows[0].avatar,
          uid: result.rows[0].uid
        };
      } else {
        // Las credenciales no son válidas
        return { success: false, message: 'Credenciales incorrectas' };
      }
    } else {
      // El usuario no fue encontrado en la base de datos
      return { success: false, message: 'Usuario no encontrado' };
    }
  } catch (error) {
    console.error('Error al buscar las credenciales de acceso', error);
    return { success: false, error: 'Error de servidor' };
  }
}


// Función para comparar contraseñas utilizando bcrypt
async function comparePasswords(plainPassword, hashedPassword) {
  const bcrypt = require('bcrypt');
  return await bcrypt.compare(plainPassword, hashedPassword);
}



// Función de hash para la contraseña (debes implementar la función hash real)
function hashFunction(password) {
  // Implementar la función de hash adecuada (por ejemplo, bcrypt)
  // Retorna la contraseña hasheada
  // Ejemplo ficticio:
  return hash(password, saltRounds);
}

// Ejemplo ficticio de función de hash con bcrypt (debes instalar el paquete bcrypt)
function hash(password, saltRounds) {
  const bcrypt = require('bcrypt');
  const salt = bcrypt.genSaltSync(saltRounds);
  return bcrypt.hashSync(password, salt);
}






module.exports = {
  Login
};
