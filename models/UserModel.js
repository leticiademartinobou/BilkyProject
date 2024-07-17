// el modelo es la representación de la estructura que vamos a utilizar en la BBDD

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    maxlenght: 20,
    require: true,
  },
  lastName: {
    type: String,
    maxlenght: 50,
    require: true,
  },
  age: {
    type: Number,
    validate: {
      validator: (value) => value >= 0 && value <= 70,
      message: "Age must be between 16 and 70.",
    },
    default: null,
  },
  email: {
    type: String,
    require: true,
    maxlenght: 50,
  },
  nif: {
    type: Number,
    require: true,
  },
  password: {
    type: String,
    require: true,
    minlenght: 16,
    maxlenght: 30,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  documents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;

// como guardar el documento en el usuario

// Hay que actualizar el usuario para decirle que ese documento que acabo de crear le pertenece

// paso siguiente hacer la implementación del middleware de autentificación
// con el middleware sería , leer si es admin o user
// en el modelo de usuario ya hay un rol. Lo que necesito es que la API
// me devuleva en un token de identificación pero que en el payload(cuerpo de ese token)
// venga cual es mi rol. Primero voy a decodificar el token, hago un condicional,
// si me dice que es usuario admin -> puede hacer x cosas y si es usuario normal, puede hacer x cosas
// lo imp es: cuanto me loggeo como usuario, me tienes que generar un token, que se haya
// comprobado la contraseña cifrada. Si la contraseña es correcta, se genera un token de
// autentificación, este token de autetificación es el mando en todas las cabeceras
// para todos los endpoints que necesiten una autentificación tenemos que añadir un
// middleware, que lea la cabecera, compruebe que viene el token y vea que es válido.
// Si es válido o no puedo continuar o no.
//
// Relacionar los modelos
// poner la relación y dejar bien estructurado las propiedades que quieres que tenga el modelo
//
// Identificar el usuario para darle los documentos
// 1. Busco al usuario con su email y le hago un update de la colección de documentos
// ¿Cómo hago un update de la colección de documentos?
// Primero cojo los documentos que ya tengo, donde hago un nuevo array donde pongo
// ... (spread op) donde pillo los documentos que ya había , (pongo una coma) el nuevo documento
// ej -> [...arrayOfDocsOfUser, newDocument] con el spread operator actualizo un array
// cuando está actualizado el array le digo que haga un update del user y
// el valor de documents va a ser este nuevo que estoy pasando que ya incluye el nuevo doc.

// ponerme ahora con la autentificación que va a ser necesaria, token, validar que el
// token es correcto

// documentsOfUser = [];

// updatedDocumentsOfUser = [...documentsOfUser, newDocument];

// aquí le tengo que decir que haga un update al user, le tengo que pasar updatedDocumentsOfUser
