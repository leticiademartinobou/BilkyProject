const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");

const auth = {
  validateToken: async (req, res, next) => {
    //extract el token con un destructuring

    const { token } = req.headers;

    console.log("token recibido", token);

    if (!token) {
      console.log("token no proporcionado");
      return res.json({
        success: false,
        message: "token no proporcionado",
      });
    }
    // verifico si el token recibido es correcto

    try {
      let verifyTokenResult = await jwt.verify(token, process.env.SECRET_KEY);
      console.log(
        "Email obtenido si la firma es correcta: ",
        verifyTokenResult.email,
        "y su rol es",
        verifyTokenResult.role
      );
      // en caso de que el token sea válido, se añade la información del usuario a req.user
      // para que esté disponible
      console.log(verifyTokenResult);

      req.user = {
        email: verifyTokenResult.email,
        role: verifyTokenResult.role,
      };

      next();
    } catch (error) {
      console.log("este es el error", error);
      return res.json({
        success: false,
        message: error,
      });
    }
  },

  isAdmin: async (req, res, next) => {
    try {
      const { token } = req.headers;

      if (!token) {
        console.log("token no proporcionado");
        return res.json({
          success: false,
          message: "Token no proporcionado",
        });
      }

      const verifyTokenResult = jwt.verify(token, process.env.SECRET_KEY);

      if (!verifyTokenResult) {
        console.log("token incorrecto o expirado");
        return res.json({
          success: false,
          message: "El token es incorrecto o ha expirado",
        });
      }

      const userInformation = await User.findOne({
        email: verifyTokenResult.email,
      });
      console.log(userInformation);

      if (!userInformation || userInformation.role !== "admin") {
        res.json({
          success: false,
          message: "Sólo el administrador puede acceder",
        });
      }
      next(); // si es admin pasa a la ruta
    } catch (error) {
      console.log("Este es el error del middleware isAdmin", error);
      return res.json({
        success: false,
        message: "Ha dado error, intenta de nuevo",
      });
    }
  },
  verifyToken: (req, res, next) => {
    // en este middleware tengo que comprobar si el token es correcto

    const verifyTokenResult = jwt.verify(token, process.env.SECRET_KEY);
    if (!verifyTokenResult) {
      return res.json({
        success: false,
        message: "email incorrecto",
      });
    }
    console.log(
      "Email obtenido si la firma es correcta: ",
      verifyTokenResult.email,
      "y su rol es",
      verifyTokenResult.role
    );

    // Si quiero devolver el email al usuario después de verificar la información:

    const verifiedUserEmail = User.find({
      email: verifyTokenResult.email,
    });
  },
  verifyUser: (req, res, next) => {
    //consulta con la BBDD si hay usuario

    const userId = req.body.user;
    if (!userId) {
      return res.status(404).json({
        success: false,
        message: "No user provided",
      });
    }
    next();
  },
  completeUserInfo: (req, res, next) => {
    if (req.body.user) {
      req.body.user = `El ID del usuario es ${req.body.user}`;
    }
    next();
  },
};

module.exports = auth;

// falta middleware verify type of doc
