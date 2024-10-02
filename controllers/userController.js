//Importar el modelo
const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const tokenService = require("../services/token");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const brevo = require('@getbrevo/brevo');
// const cryptoRandomString = require("crypto-random-string");

// Email options

let apiInstance = new brevo.TransactionalEmailsApi(); // sacado de la documentación npm brevo

apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,process.env.BREVO_KEY
  
)

// Función para enviar el correo de confirmación
async function sendConfirmationEmail(userEmail, userName) {
try {
  
  let sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.subject = "Confirmación de Registro";
  sendSmtpEmail.to = [{ email: userEmail, name: userName }];
  sendSmtpEmail.htmlContent = `<html><body><h1>Hola ${userName}, gracias por registrarte en nuestra plataforma</h1></body></html>`;
  sendSmtpEmail.sender = { name: "Bilky", email: "leticiademartino@gmail.com" };

  // sendSmtpEmail.sender = { name: "Bilky", email: "no-reply@bilky.com" };

  
  const result = await apiInstance.sendTransacEmail(sendSmtpEmail)
  console.log("Correo enviado correctamente:")
  // console.log(result)
} catch (error) {
  console.log("Este es el error", error)
}
}


// Función para generar una contraseña nueva de 16 caracteres

function generateRandomPassword() {
  return crypto.randomBytes(8).toString("hex");
}

// crypto.randomBytes(8):

// Aquí se genera un código de 8 random bytes. Cada byte tiene 8 bits

// .toString("hex"):

// este método convierte 8 bytes en un string hexadecimal
// cada byte (8 bits) son dos carácteres hexadecimales (8 * 2 = 16)
// la función genera una password de 16 caractéres

//defino controlador

const userController = {
  getUsers: async function (req, res) {
    console.log(
      "llamando al método GET users para obtener todos los resultados de la aplicación"
    );

    if (req.user.role === "user") {
      //req.user.role
      console.log(
        "El usuario user no puede obtener todo el listado de usuarios ya que su rol no lo permite"
      );
      return res.json({
        success: false,
        message:
          "El usuario user no puede obtener todo el listado de usuarios ya que su rol no lo permite",
      });
    } else if (req.user.role === "admin") {
      //req.user.role

      const userList = await User.find().populate("documents");

      console.log("El usuario admin tiene acceso a todo");

      return res.json({
        success: true,
        message: "El usuario admin tiene acceso a todo",
        data: userList,
      });
    } else {
      console.log("Los únicos usuarios que existen son admin o user");
      return res.json({
        success: false,
        message: "Los únicos usuarios que existen son admin o user",
      });
    }
  },

  getUserByEmail: async (req, res) => {
    try {
      console.log("estás intentando buscar un email en la lista de usuarios");
      // console.log(req.query);
      console.log("Email del param", req.params)

      // const { email } = req.query;
      const { email } = req.params;


      if (!email) {
        return res.json({
          success: false,
          message: "el email es necesario",
        });
      }

      const userListEmailFound = await User.findOne({ email: email });

      return res.json({
        success: true,
        data: userListEmailFound,
      });
    } catch (error) {
      console.log("este es el error:", error);
      return res.json({
        success: false,
        message: "Se ha producido un error, intenta de nuevo",
      });
    }
  },
  addUser: async (req, res) => {
    try {
      console.log("estás entrando en el método POST add user");
      const { name, lastName, age, email, nif, password, role } = req.body;

      if (!name || !lastName || !email || !nif || !password) {
        return res.json({
          success: false,
          message:
            "Es obligatorio el nombre, apellido, nif, email y contraseña",
        });
      }

      // añadir a la BBDD un usuario

      const passwordToSave = await bcrypt.hash(password, 10);
      console.log("este es el cifrado de la contraseña: ", passwordToSave);

      // hay que comprobar si el email existe de antes o no

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log("el usuario ya está registrado");
        return res.json({
          success: false,
          message:
            "El email ya existe en la base de datos, utilice otro email o recupere su contraseña",
        });
      }

      //constante para crear nuevos usuarios en la BBDD

      const newUser = await User.create({
        name,
        lastName,
        age,
        email,
        nif,
        password: passwordToSave,
        role,
      });

      console.log(
        "Se ha creado el usuario con la siguiente información:",
        newUser
      );

      // Enviar correo de confirmación de registro
      await sendConfirmationEmail(email, name);

      return res.json({
        success: true,
        message: "Usuario creado correctamente",
        data: newUser,
      });
    } catch (error) {
      console.log("Se ha producido un error: ", error);
      return res.json({
        success: false,
        message: "Se ha producido un error creando el usuario intente de nuevo",
      });
    }
  },
  userLogin: async (req, res) => {
    // comprobamos si el email existe en la BBDD
    // En caso de que sí, comprobamos si la contraseña coincide con la almacenada en la BBDD

    try {
      console.log("Estás haciendo el login del user");

      const { email, password } = req.body;

      // Validaciones

      if (!email || !password) {
        return res.json({
          success: false,
          message: "Failed login,la contraseña y el email son obligatorios",
        });
      }
      const userInformation = await User.findOne({ email });
      console.log(userInformation);

      if (!userInformation) {
        res.json({
          success: false,
          message: "Datos de usuario incorrectos",
        });
      }

      // Comprobamos si la contraseña coincide con la almacenada en la BBDD

      const matchPassword = await bcrypt.compare(
        password,
        userInformation.password
      );

      console.log(
        "esto es lo que sale al hacer un console.log de matchPassword: ",
        matchPassword
      );

      // validaciones de contraseña y role

      if (!matchPassword) {
        return res.json({
          success: false,
          message: "Contraseña incorrecta",
        });
      }

      const userRole = userInformation.role;
      const userName = userInformation.name;        
      const userLastName = userInformation.lastName;
      const userId = userInformation._id

      console.log("este es el role de la BBDD:", userRole);
      console.log("Este es el nombre del usuario:", userName);
      console.log("Este es el apellido del usuario:", userLastName);
      console.log("Este es el ID del usuario:", userId);


      // Si nada falla generamos el token

      const generatedToken = await tokenService.generateToken(email, userRole, userName, userLastName, userId);
      console.log(generatedToken);

      return res.json({
        success: true,
        generatedToken,
      });
    } catch (error) {
      console.log("Este es el error que ha dado", error);

      return res.json({
        success: false,
        message: "Error, intente hacer el login de nuevo",
      });
    }

    // aquí recibimos los datos para registrar un usuario
    // las contraseñas nunca se mandan con GET si no que se mandan con POST
  },

  updateUser: async (req, res) => {

    const { newEmail, password }  = req.body // email y password lo cojo del body
    const userId = req.user.userId // obtengo el userId del token

    try {
      console.log("vas a modificar un usuario");

      // console.log(req.query);

      // const { email, name, lastName, role } = req.body;

      if (!userId) {
        return res.json({
          success: false,
          message: "No se ha encontrado el userId en el token",
        });
      }

      const userToUpdateEmailFoundById = await User.findById(userId);
      


      if (!userToUpdateEmailFoundById) {
        console.log("Usuario no encontrado");
        return res.json({
          success: false,
          message: "usuario no encontrado",
        });
      }

      // actualizar los detalles del usuario

      if(newEmail) userToUpdateEmailFoundById.email = newEmail
      if(password) userToUpdateEmailFoundById.password = password // verificar que esté hasheada en mi User modell
      if(req.body.name) userToUpdateEmailFoundById.name = req.body.name
      if(req.body.lastName) userToUpdateEmailFoundById.lastName = req.body.lastName
      if(req.body.role) userToUpdateEmailFoundById.role = req.body.role

      // guardo lo actualizado en la BBDD de Mongo

      const updatedUser = await userToUpdateEmailFoundById.save()

      return res.json({
        success: true,
        message: "Has encontrado y actualizado un usuario",
        data: updatedUser,
      });
    } catch (error) {
      console.log("este es el error que se ha producido", error);
      return res.json({
        success: false,
        message: "Ha ocurrido un error, intente de nuevo",
      });
    }
  },
  deleteUser: async (req, res) => {
    try {
      console.log("vas a borrar un usuario");

      console.log(req.query);

      const { email } = req.query;

      if (!email) {
        return res.json({
          success: false,
          message: "el email es necesario para borrar un usuario",
        });
      }

      const userToDeleteEmailFoundByEmail = await User.findOneAndDelete({
        email: email,
      });

      if (!userToDeleteEmailFoundByEmail) {
        return res.json({
          success: false,
          message: "usuario no encontrado",
        });
      }

      return res.json({
        success: true,
        message: "Has encontrado y borrado un usuario",
        data: userToDeleteEmailFoundByEmail,
      });
    } catch (error) {
      console.log("este es el error que se ha producido", error);
      return res.json({
        success: false,
        message: "Ha ocurrido un error, intente de nuevo",
      });
    }
  },
  getUserProfile: async (req, res) => {
    try {
      console.log("estás accediendo a los datos del user profile");

      const email = req.user.email;

      const userProfile = await User.findOne({ email });

      if (!userProfile) {
        console.log("usuario no encontrado");
        return res.json({
          success: false,
          message: "usuario no encontrado",
        });
      }

      const userList = await User.find().populate("documents");

      // console.log("estos son los datos del user profile", userProfile);
      // console.log("estos son los documentos,", userList);

      return res.json({
        success: true,
        message: "usuario encontrado",
        data: userProfile,
        userList,
      });
    } catch (error) {
      console.log("se ha producido un error:", error);
    return res.json({
      success: false,
      message: "se ha producido un error al intentar recuperar el perfil",
    });
    }
  },
  
  recuperatePassword: async (req, res) => {

    const { email } = req.body;

    try {
      console.log("estás intentando cambiar la contraseña para", email);

      // verifico si existe el email que me manda el usuario

      if (!email) {
        console.log("el email no está en la BBDD");
        return res.json({
          success: false,
          message: "El email es necesario para recuperar la contraseña",
        });
      }

        // Verificar si el usuario existe en la base de datos
        
        const user = await User.findOne({ email });

        if(!user) {
          console.log("Usuario no encontrado");
          return res.json({
            success: false, 
            message: "Usuario no encontrado",
          })
        }

        // generar un token único para la recuperación de la contraseña (durante 1 hora)

        const resetToken = crypto.randomBytes(8).toString("hex"); // Token original
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // Token hasheado
        const tokenExpiration = Date.now() + 3600000;

        // Guardar el token y su fecha de expiración en el usuario
      
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = tokenExpiration;
        await user.save();

        // envío un correo electrónico con el token de recuperación 

        // no tengo el dominio bilky :( (aún)
        const resetLink = `http://localhost:3000/reset-password/${resetToken}`;  // aquí envío el token sin hashear
        console.log("este es el enlace de que envío al correo",resetLink)

        const emailContent =  `
        <html>
        <body>
          <h1>Recuperación de contraseña </h1>
          <p>Hola ${user.name}, </p>
          <p>Este es el enlace para restablecer tu contraseña </p>
          <a href ="${resetLink}">Restablecer contraseña</a>
          <p>Aviso! el enlace es válido sólo durante 1 hora </p>

        </body>
        </html>
        `;

        let sendSmtpEmail = new brevo.SendSmtpEmail();

        sendSmtpEmail.subject = "Recuperación de contraseña"
        sendSmtpEmail.to = [{email: user.email, name: user.name}]
        sendSmtpEmail.htmlContent = emailContent
        sendSmtpEmail.sender = {name: "Bilky", email: "leticiademartino@gmail.com"}

        const result = await apiInstance.sendTransacEmail(sendSmtpEmail)
        console.log("correo enviado correctamente")
        // console.log(result)

        return res.json({
          success: true, 
          message:"correo de recuperación enviado correctamente", 
          token: resetToken 

        })
    } catch (error) {
      console.log(
        "se ha producido un error al intentar reestrablecer la contraseña",
        error
      );
      return res.json({
        success: false,
        message: "Error al restablecer la contraseña",
      });
    }
  },
  //función para restablecer la contraseña con el token
  resetPassword: async (req, res) => {

    const { token } = req.params // El token que llega desde la URL sin hashear
    const { newPassword } = req.body // La nueva contraseña del usuario

    try {

      // Hashear el token que llega para compararlo con el almacenado en la base de datos
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const user = await User.findOne({
        resetPasswordToken: hashedToken, 
        resetPasswordExpires: { $gt: Date.now() }
      })

      // { $gt: Date.now() }:

      // $gt es un operador de MongoDB que significa "mayor que" (del inglés greater than).
      // Date.now() devuelve la fecha y hora actual en milisegundos desde el 1 de enero de 1970.
      // Entonces, { $gt: Date.now() } está comprobando si el campo resetPasswordExpires es mayor que el valor de Date.now(), es decir, si el tiempo de expiración del token es posterior a la hora actual.
    
      if(!user) {
        return res.json({
          success: false, 
          message: "Token no válido o expirado"
        })
      }
  
      // Hashear la nueva contraseña antes de guardarla
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined; // Limpiar el token y su expiración

      await user.save();

      console.log("contraseña actualizada correctamente")

      return res.json({
        success: true,
        message: "contraseña actualizada correctamente"
      })
  
  } catch (error) {

    console.log("este es el error por el que no se ha podido actualizar la contraseña", error)

    return res.json({
      success: false, 
      message: "No se ha podido actualizar la contraseña", error
    })
      
    }
  }
};

module.exports = userController;