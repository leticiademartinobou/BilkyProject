// el modelo es la representación de la estructura que vamos a utilizar en la BBDD

const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: null,
  },
  deletedAt: {
    type: Date,
    default: null,
    //cuidado! cuando se haga un find de todos los docs hay que excluir estos, no vamos a hacer un delete "real"
  },
});

const Document = mongoose.model("Document", DocumentSchema);

module.exports = Document;
