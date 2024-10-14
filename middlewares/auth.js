const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");

const auth = {
  validateToken: async (req, res, next) => {
    //extract el token del authorization header

    // comprobaciones por errores varios


    const token = req.header("Authorization")?.split(" ")[1]; // Extracts token from 'Bearer <token>'

    // Extracción del Token: Ahora se usa req.headers.authorization?.split(" ")[1] para extraer el token en el formato Bearer <token>. Esto es un estándar común.

    console.log("token recibido", token);

    if (!token) {
      console.log("token no proporcionado");
      return res.json({
        success: false,
        message: "token no proporcionado",
      });
    }
    
    try {
      // verifico si el token recibido es correcto
      let verifyTokenResult = await jwt.verify(token, process.env.SECRET_KEY); // esto es para verificar el token
      console.log(
        "Email obtenido si la firma es correcta: ",verifyTokenResult.email,
        "y su rol es:", verifyTokenResult.role, 
        "y su userId es:", verifyTokenResult.userId
      );
      // en caso de que el token sea válido, se añade la información del usuario a req.user
      // para que esté disponible
      console.log("este es el verifyTokenResult",verifyTokenResult);

      req.user = {
        userId: verifyTokenResult.userId,
        email: verifyTokenResult.email,
        role: verifyTokenResult.role,
        name: verifyTokenResult.name,
        lastName: verifyTokenResult.lastName

      };

      next(); // que se vaya al siguiente middleware

    } catch (error) {
      console.log("este es el error", error);
      return res.json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  },

  isAdmin: async (req, res, next) => {

    if(!req.user || req.user.role !== "admin") {
      return res.json({
        success:false, 
        message:"sólo los usuarios admin pueden acceder"
      });
    }

    next();

  },
  verifyToken: (req, res, next) => {
    // en este middleware tengo que comprobar si el token es correcto

   if(!req.user) {
    return res.json({
      success:false, 
      message:"Token no válido o información de usuario no encontrada"
    });
   }
    next()
  },
  // verifyUser: (req, res, next) => {
  //   //consulta con la BBDD si hay usuario

  //   const userId = req.body.user;
  //   if (!userId) {
  //     return res.status(404).json({
  //       success: false,
  //       message: "No user provided",
  //     });
  //   }
  //   next();
  // },
  // completeUserInfo: (req, res, next) => {
  //   if (req.body.user) {
  //     req.body.user = `El ID del usuario es ${req.body.user}`;
  //   }
  //   next();
  // },
};

module.exports = auth;

// falta middleware verify type of doc
