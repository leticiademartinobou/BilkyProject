//importo los módulos que necesito

require("dotenv").config();

const express = require("express");
const userRouter = require("./routes/userRoutes");
const documentRouter = require("./routes/documentRoutes");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const bodyParser = require("body-parser");
const cors = require("cors");
// const cryptoRandomString = require("crypto-random-string");

// Instanciar (crear) objeto de tipo express

const app = express();

//configuración para permitir las solicitudes cors - sirve para que interactúen diferentes dominios
app.use(cors());

//Añado el parser de JSON para entender los json que vengan en el body

app.use(express.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

//Conexión con la BBDD

mongoose
  .connect(
    "mongodb+srv://leticiademartino:9SmzT0Qj63ZCmrOB@clusterbilky1.loakc3y.mongodb.net/BilkyUsers",
    // {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    // }
  )
  .then(() => console.log("¡Conexión establecida con la base de datos!"))
  .catch((err) => console.log("Se ha producido un error", err));

// configurar Cloudinary

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// configurar multer, es más fácil porque el archivo no se va a almacenar aquí a lp

// Enlazamos las rutas de los endpoints

app.use("/user", userRouter);
app.use("/document", documentRouter);

// arrancamos el servidor

app.listen(3000, () => {
  console.log("servidor rulando");
});
