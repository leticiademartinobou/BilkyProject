//Importar el modelo
const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const tokenService = require("../services/token");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const brevo = require('@getbrevo/brevo');
// const cryptoRandomString = require("crypto-random-string");

let apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_KEY);

async function testSendEmail() {
    try {
        let sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.subject = "Prueba de Envío";
        sendSmtpEmail.to = [{ email: "tu-email@example.com" }];
        sendSmtpEmail.htmlContent = "<html><body><h1>Prueba de Envío</h1></body></html>";
        sendSmtpEmail.sender = { name: "Bilky", email: "leticiademartino@gmail.com" };

        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log("Correo de prueba enviado:", result);
    } catch (error) {
        console.error("Error en el envío de prueba:", error);
    }
}

testSendEmail();


// configuración de la API de Brevo

// let apiInstance = new brevo.TransactionalEmailsApi(); // sacado de la documentación npm brevo

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
  console.log("Correo enviado correctamente:", result)
} catch (error) {
  console.log("Este es el error", error)
}
}

// función para enviar el correo de recuperación 

async function sendRecoveryEmail(userEmail, userName, resetLink) {

  try {
    let sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject = "Recuperación de contraseña"
    sendSmtpEmail.to = [{ email: userEmail, name: userName}];
    sendSmtpEmail.content = `
      <html>
        <body>
          <h1>Recuperación de contraseña</h1>
          <p>Hola ${userName},</p><p>Este es el enlace para restablecer tu contraseña:</p>
          <a href="${resetLink}">Restablecer contraseña</a>
          <p>Aviso: el enlace es válido solo durante 1 hora.</p>
        </body>
      </html>`;
      sendSmtpEmail.sender = { name: "Bilky", email: "leticiademartino@gmail.com" };

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("correo de recuperación correctamente enviado", result);

  } catch (error) {
    // alert("No se ha podido enviar el correo de recuperación")
    console.log("este es el error por el que no se ha enviado el correo de recuperación", error)
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

      console.log("este es el role de la BBDD:", userRole);
      console.log("Este es el nombre del usuario:", userName);
      console.log("Este es el apellido del usuario:", userLastName);

      // Si nada falla generamos el token

      const generatedToken = await tokenService.generateToken(email, userRole, userName, userLastName);
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
    try {
      console.log("vas a modificar un usuario");

      console.log(req.query);

      const { email, name, lastName, role } = req.body;

      if (!email) {
        return res.json({
          success: false,
          message: "el email es necesario para actualizar un usuario",
        });
      }

      const userToUpdateEmailFoundByEmail = await User.findOneAndUpdate(

        {
          email: email,
        },
        { name, lastName, role },
        { new: true }
      );
      


      if (!userToUpdateEmailFoundByEmail) {
        console.log("Usuario no encontrado");
        return res.json({
          success: false,
          message: "usuario no encontrado",
        });
      }

      return res.json({
        success: true,
        message: "Has encontrado y actualizado un usuario",
        data: userToUpdateEmailFoundByEmail,
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

      console.log("estos son los datos del user profile", userProfile);
      console.log("estos son los documentos,", userList);

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
    try {
      console.log("estás intentando cambiar tu contraseña");

      // Verificar si la clave de API está cargada correctamente
      console.log("Brevo API Key:", process.env.BREVO_KEY);

      const { email } = req.body;

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

        const resetToken = crypto.randomBytes(8).toString("hex");
        const tokenExpiration = Date.now() + 360000;

        // Guardar el token y su fecha de expiración en el usuario
      
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = tokenExpiration;
        await user.save();

        // envío un correo electrónico con el token de recuperación 

        const resetLink = `http://localhost:3000/resetPassword/${resetToken}`;  // no tengo el dominio bilky :( (aún)

        // enviar correo de recuperación

        await sendRecoveryEmail(user.email, user.name, resetLink)

        return res.json({
          success: true, 
          message:"correo de recuperación enviado correctamente"

        })
    } catch (error) {
      console.log(
        "se ha producido un error al intentar reestrablecer la contraseña",
        // error
        error.response ? error.response.body : error // imprime el cuerpo del error
      );
      return res.json({
        success: false,
        message: "Error al restablecer la contraseña",
      });
    }
  },
  //función para restablecer la contraseña con el token
  resetPassword: async (req, res) => {
    try {
      const { token } = req.params
      const { newPassword } = req.body

      // Buscar al usuario por el token y verificar que no haya expirado

      const user = await User.findOne({
        resetPasswordToken: token, 
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
  
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      user.password = hashedPassword;
      user.resetPasswordToken = undefined; // Eliminar el token para que no pueda ser reutilizado
      user.resetPasswordExpires = undefined;

      await user.save();

      console.log("contraseña reestablecida correctamente")

      return res.json({
        success: true,
        message: "contraseña reestablecida correctamente"
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