const jwt = require("jsonwebtoken");

const token = {
  generateToken: async (email, role) => {
    // generar el JWT

    // cómo se crea el jwt? así:
    // las opciones es el ultimo {} y ponemos cuando expira el token

    const token = await jwt.sign(
      {
        email,
        role,
      },
      process.env.SECRET_KEY,
      { expiresIn: "5m" }
    );
    return token;
  },
};

module.exports = token;

// con el servicio ya no se genera el token
