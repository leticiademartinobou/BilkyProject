//Importar el modelo
const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const tokenService = require("../services/token");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
// const cryptoRandomString = require("crypto-random-string");

// Email options

const emailOptions = {
  user: process.env.FROM_EMAIL,
  pass: process.env.GMAIL_PASSWORD,
  to: "",
  subject: "", // según el texto que necesite cambio subject y cuerpo mail
  text: "",
};

//llamo a la libreria gmail-send y la ejecuto
const emailSend = require("gmail-send")(emailOptions);

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
      console.log(req.query);

      const { email } = req.query;

      if (!email) {
        return res.json({
          success: false,
          message: "el email es necesario",
        });
      }

      const userListEmailFound = await User.find({ email: email });

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

      // digo a qué dirección de email quiero enviar el "te has registrado correctamente"

      // const sendRegistrationEmail = emailSend({

      //email send es una opción dentro de la libreria gmail-send
      emailSend(
        {
          ...emailOptions,
          to: email,
          subject: "Te has registrado correctamente",
          text: "te has registrado correctamente en la plataforma",
        },
        (error, result, full) => {
          if (error) {
            console.log("no se ha podido enviar el email", error);
            return res.json({
              success: false,
              message: "no se ha podido enviar el email",
            });
          } else {
            console.log("email enviado correctamente", result);
          }
        }
      );

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

      console.log("este es el role de la BBDD:", userRole);

      // Si nada falla generamos el token

      const generatedToken = await tokenService.generateToken(email, userRole);
      console.log(generatedToken);

      res.json({
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

      const { email } = req.query;

      if (!email) {
        return res.json({
          success: false,
          message: "el email es necesario para actualizar un usuario",
        });
      }

      const userToUpdateEmailFoundByEmail = await User.updateOne(
        {
          email: email,
        },
        { email: req.body.email },
        { new: true }
      );

      if (!userToUpdateEmailFoundByEmail) {
        console.log("Usuario no encontrado");
        return res.json({
          success: false,
          message: "usuario no encontrado",
        });
      }

      res.json({
        success: true,
        message: "Has encontrado y actualizado un usuario",
        data: userToUpdateEmailFoundByEmail,
      });
    } catch (error) {
      console.log("este es el error que se ha producido", error);
      res.json({
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
  recoverPassword: async (req, res) => {
    try {
      console.log("estás intentando cambiar tu contraseña");

      const { email } = req.body;

      // verifico si existe el email que me manda el usuario

      if (!email) {
        console.log("el email no está en la BBDD");
        return res.json({
          success: false,
          message: "El email no existe",
        });
      }

      // genero la contraseña sin cifrar

      const newPassword = generateRandomPassword();

      // actualizo la contraseña del usuario en BBDD,pero la tengo que cifrar antes

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      //actualizo contraseña cifrada en BBDD

      await User.findOneAndUpdate({ email }, { password: hashedPassword });

      // pero yo le mando al usuario por email la contraseña sin cifrar newPassword

      // preparo el email

      const recoveryPasswordEmail = {
        ...emailOptions,
        to: email,
        subject: "esta es tu nueva contraseña",
        text: `Hola ${email} tu nueva contraseña es ${newPassword}`,
      };

      // mandar el email

      // const sendRecoveryPasswordEmail = emailSend(recoveryPasswordEmail);

      emailSend((error, result, fullResult) => {
        if (error) {
          console.log(
            "no se ha podido enviar el email de recuperación de contraseña",
            error
          );
          return res.json({
            success: false,
            message:
              "no se ha podido enviar el email de recuperación de contraseña",
          });
        } else {
          console.log(
            "correo de recuperación de contraseña enviado correctamente",
            result
          );
          return res.json({
            success: true,
            message:
              "correo de recuperación de contraseña enviado correctamente",
          });
        }
      });
    } catch (error) {
      console.log(
        "se ha producido un error al intentar recuperar la contraseña",
        error
      );
      return res.json({
        success: false,
        message: "se ha producido un error al intentar recuperar la contraseña",
      });
    }
  },
};

module.exports = userController;
