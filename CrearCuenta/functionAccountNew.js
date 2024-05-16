const connection = require('../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');




function generarID() {
  return uuidv4();
}

//Funcion para validar si existe un correo igual en la base de datos
async function checkEmailExists(req, res) {
  const { email } = req.params; // Suponiendo que el correo se pasa como parámetro en la URL

  const script = 'SELECT * FROM users WHERE email = $1';
  try {
    const result = await connection.query(script, [email]);

    if (result.rows.length > 0) {
      // El correo electrónico existe en la base de datos
      //console.log("El correo existe");
      res.status(200).json({ exists: true });
    } else {
      // El correo electrónico no existe en la base de datos
      //console.log("El correo no existe");
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error('Error al buscar el correo electrónico', error);
    res.status(500).json({ error: 'Error de servidor' });
  }
}


// Función para agregar un nuevo usuario
async function addUser(req, res, data) {
  uid = generarID();
  const hashedPassword = hashFunction(data.Contrasena);
  const addUserScript = 'INSERT INTO users (uid, email, password, activate) VALUES ($1, $2, $3, $4)';
  try {
    await connection.query(addUserScript, [uid, data.Correo, hashedPassword, false]);
    
    
  } catch (error) {
    console.error('Error al agregar usuario', error);
    res.status(500).json({ error: 'Error de servidor al agregar usuario' });
  }
  const addPersonalInfoScript = 'INSERT INTO personal_information (uid, nombre, apellidop, apellidom, avatar, nacimiento) VALUES ($1, $2, $3, $4, $5, $6)';
  try {
    await connection.query(addPersonalInfoScript, [uid, data.Nombre, data.ApellidoPaterno, data.ApellidoMaterno, "default", "2000-01-01"]);
    res.status(201).json({ message: 'Usuario agregado correctamente', uid: uid, email: data.Correo });
  } catch (error) {
    console.error('Error al agregar información personal', error);
    res.status(500).json({ error: 'Error de servidor al agregar información personal' });
  }
}

// Función para activar un usuario existente
async function activateUser(req, res, email) {
  const activateUserScript = 'UPDATE users SET activate = true WHERE email = $1';
  try {
    await connection.query(activateUserScript, [email]);
    res.status(200).json({ message: 'Usuario activado correctamente', email: email });
  } catch (error) {
    console.error('Error al activar usuario', error);
    res.status(500).json({ error: 'Error de servidor al activar usuario' });
  }
}

// Función para actualizar la información personal de un usuario existente
async function updatePersonalInfo(req, res, nacimiento, avatar, uid) {
  const updatePersonalInfoScript = `
    UPDATE personal_information
    SET avatar = $1, nacimiento = $2
    WHERE uid = $3
  `;

  try {
    await connection.query(updatePersonalInfoScript, [avatar, nacimiento, uid]);
    //console.log("Cuenta completada");
    res.status(200).json({ message: 'Información personal actualizada correctamente', uid: uid });
  } catch (error) {
    console.error('Error al actualizar información personal', error);
    res.status(500).json({ error: 'Error de servidor al actualizar información personal' });
  }
}






const saltRounds = 10; // Número de rondas de sal para bcrypt, ajusta según sea necesario


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
  checkEmailExists, addUser, activateUser, updatePersonalInfo
};
