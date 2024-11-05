const jwt = require("jsonwebtoken");

const token = {
  generateToken: async (email, role, name, lastName, userId) => {
    // Generar el JWT con los campos proporcionados: email, role, name, y lastName.
    try {
      const token = await jwt.sign(
        {
          email,
          role,
          name, 
          lastName, 
          userId
        },
        process.env.SECRET_KEY,  // Clave secreta que se usará para firmar el token
        { expiresIn: "55m" }      // El token expira en 5 minutos
      );
 
      return token;
    } catch (error) {
      console.error("Error al generar el token:", error);
      throw new Error("No se pudo generar el token");
    }
  },
};

module.exports = token;

