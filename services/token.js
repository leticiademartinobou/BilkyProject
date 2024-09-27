const jwt = require("jsonwebtoken");

const token = {
  generateToken: async (userId, email, role, name, lastName) => {
    // Generar el JWT con los campos proporcionados: email, role, name, y lastName.
    try {
      const token = await jwt.sign(
        {
          userId,
          email,
          role,
          name, 
          lastName
        },
        process.env.SECRET_KEY,  // Clave secreta que se usará para firmar el token
        { expiresIn: "5m" }      // El token expira en 5 minutos
      );
      console.log("propiedades", userId, email, role, name, lastName)
      return token;
    } catch (error) {
      console.error("Error al generar el token:", error);
      throw new Error("No se pudo generar el token");
    }
  },
};

module.exports = token;

