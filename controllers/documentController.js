//Importar el modelo

const Document = require("../models/DocumentModel");
const User = require("../models/UserModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const documentController = {
  getDocuments: async (req, res) => {
    try {
      console.log("estás obteniendo todos los documents");
      const documentsList = await Document.find();
      console.log("documentos obtenidos correctamente");

      return res.json({
        success: true,
        message: "listado de documentos obtenido correctamente",
        data: documentsList,
      });
    } catch (error) {
      console.log("este es el error que tienes antes de obtener los docs",error);
      return res.json({
        success: false,
        message: "No se han podido obtener los documentos",
        error,
      });
    }
  },
  uploadDocument: async (req, res) => {
    try {
      console.log("estás haciendo el upload del doc con el user dentro del model del doc");

      const { title, description, userEmail } = req.body;

      console.log("Title recibido", title)
      console.log("description recibida", description)

      if(!title || !userEmail) {
        console.log("el título y el email de usuario son obligatorios")
        return res.json({
          success: false, 
          message: "el título y el email de usuario son obligatorios"
        })
      }

      // tengo que buscar al usuario por el email que me ha proporcionado

      const userToUpdateDocuments = await User.findOne({ email: userEmail });
      // console.log(userToUpdateDocuments);

      //si no lo encuentra devuelvo un error

      if (!userToUpdateDocuments) {
        console.log("No se ha encontrado el usuario");
        return res.json({
          success: false,
          message: "usuario no encontrado",
        });
      }

      if(!req.file) {
        return res.json({
          success: false, 
          message: "No se ha podido subir ningún archivo",
        })
      }

      //guardar el documento en cloudinary (y luego sacar) la url

      // console.log("esto es req.file", req.file.path);

      console.log("Subiendo el documento a cloudinary")
      const uploadedDocument = await cloudinary.uploader.upload(req.file.path);
      // console.log("este es el uploaded doc: ", uploadedDocument);

      console.log("mirar la url", uploadedDocument.url);

      const { url } = uploadedDocument;

      const document = new Document({
        title,
        description,
        url,
        user: userToUpdateDocuments._id, // ID del usuario en MongoDB
      });

      // console.log("mirar la url", document.url);

      const documentSaved = await document.save();

      //       pasos

      // 1. Encontrar el usuario por email -> userToUpdateDocuments
      // 2. Upload el documento y obtener su URL  -> uploadedDocument.url
      // 3. Save del document en cloudinary.
      // 4. actualizar el array de los documentos del usuario con spread operator. Tras buscar al usuario por mail
      //    le decimos que la propiedad documents es = al nuevo array de documentos
      // 5. Guardar el documento en updateUser.

      // Actualizar los documentos del usuario con spread operator

      const updateUser = await User.findByIdAndUpdate(
        // cojo el id de MongoDB que he sacado antes buscando con el email
        userToUpdateDocuments._id,
        {
          $set: {
            documents: [...userToUpdateDocuments.documents, document._id], // puedo utilizar $push : { documents: documentSaved._id} para añadir un doc al array existente
          },
        },
        { new: true } // Devuelve el documento actualizado y no el original
      );

      console.log("Documento actualizado", updateUser);

      res.status(201).send(documentSaved);
    } catch (error) {
      res.status(500).send(error);
      console.log(
        "Este es el error por el que no se ha podido subir el doc",
        error
      );
    }
  },

  updateDocumentName: async function (req, res) {
    try {
      console.log("Estás actualizando un documento");

      const { id, title } = req.body;

      if (!id || !title) {
        console.log("el ID y el title son obligatorios");
        return res.json({
          sucess: false,
          message: "el ID y el title son obligatorios, por favor inclúyelos",
        });
      }

      const documentToUpdateName = await Document.findByIdAndUpdate(
        id,
        { title: title, updatedAt: Date() },
        { new: true }
      );

      if (!documentToUpdateName) {
        console.log("no se ha encontrado el documento");
        return res.json({
          success: false,
          message: "documento no encontrado",
        });
      }

      console.log("el nombre del documento se ha actualizado correctamente");
      return res.json({
        success: true,
        message: "el nombre del documento se ha actualizado correctamente",
      });
    } catch (error) {
      console.log(
        "este es el error que te está dando al actualizar el nombre",
        error
      );
      return res.json({
        success: false,
        message: "ocurrió un error al actualizar el nombre del documento",
      });
    }
  },

  deleteDocument: async function (req, res) {
    try {
      console.log("Estás borrando un documento");

      if (!req.user) {
        console.log("No user found in request");
        return res.json({
          success: false,
          message: "Usuario no encontrado en la solicitud",
        });
      }

      // tengo que comprobar si el usuario es admin para que pueda añadir el deletedAt
      console.log("este es el user", req.user);

      if (req.user.role === "user") {
        console.log(
          "El usuario user no puede borrar documentos, ya que su rol no lo permite"
        );
        return res.json({
          success: false,
          message:
            "El usuario user no puede borrar documentos, ya que su rol no lo permite",
        });
      } else if (req.user.role === "admin") {
        console.log(
          "El usuario admin si puede borrar documentos, ya que su rol sí lo permite"
        );

        // cojo el id que me indica el usuario admin desde el req.body con un destructuring
        // de esta manera saco el id del body

        const { documentId } = req.body;

        if (!documentId) {
          console.log("tienes que incluir el id");

          return res.json({
            success: false,
            message: "El id no está incluido y es obligatorio",
          });
        }

        const documentToDelete = await Document.findByIdAndUpdate(
          documentId,
          { deletedAt: new Date() },
          { new: true }
        );

        if (!documentToDelete) {
          console.log("no se ha encontrado el documento");
          return res.json({
            success: false,
            message: "documento no encontrado",
          });
        }

        // tengo que marcar y borrar en el array de documentos el documento del usuario

        await User.findByIdAndUpdate(documentToDelete.user, {
          $pull: { documents: documentToDelete._id}
        })

        console.log("Documento marcado como eliminado", documentToDelete)

        // si encuentra el documento lo marca con deletedAt

        return res.json({
          success: true,
          message: "documento marcado como eliminado",
          data: documentToDelete,
        });
      }
    } catch (error) {
      console.log(
        "este es el error que has obtenido intentando borrar el doc",
        error
      );
      return res.json({
        success: false,
        message: "Error al borrar el documento",
      });
    }
  },
};

module.exports = documentController;


