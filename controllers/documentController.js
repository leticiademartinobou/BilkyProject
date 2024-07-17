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
      console.log(
        "este es el error que tienes antes de obtener los docs",
        error
      );
      return res.json({
        success: false,
        message: "No se han podido obtener los documentos",
        error,
      });
    }
  },
  uploadDocument2: async (req, res) => {
    try {
      console.log(
        "estás haciendo el upload del doc con el user dentro del model del doc"
      );

      const { title, userEmail } = req.body;

      // tengo que buscar al usuario por el email que me ha proporcionado

      const userToUpdateDocuments = await User.findOne({ email: userEmail });
      console.log(userToUpdateDocuments);

      //si no lo encuentra devuelvo un error

      if (!userToUpdateDocuments) {
        console.log("No se ha encontrado el usuario");
        return res.json({
          success: false,
          message: "usuario no encontrado",
        });
      }

      //guardar el documento en cloudinary (y luego sacar) la url

      console.log("esto es req.file", req.file.path);

      const uploadedDocument = await cloudinary.uploader.upload(req.file.path);
      console.log("este es el uploaded doc: ", uploadedDocument);

      console.log("mirar la url", uploadedDocument.url);

      const { url } = uploadedDocument;

      const document = new Document({
        title,
        url,
        user: userToUpdateDocuments._id, // ID del usuario en MongoDB
      });

      console.log("mirar la url", document.url);

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
            documents: [...userToUpdateDocuments.documents, document._id],
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

        const { id } = req.body;

        if (!id) {
          console.log("tienes que incluir el id");

          return res.json({
            success: false,
            message: "El id no está incluido y es obligatorio",
          });
        }

        const documentToDelete = await Document.findByIdAndUpdate(
          id,
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

// // subir archivos a cloudinary
// // endpoint para subir 1 archivo
// //esto hay que meterlo en el controller
// app.post("/upload", upload.single("file"), (req, res) => {
//   if (!req.file) {
//     return res.status(400).send("No files uploaded");
//   }
//   // en caso de que sí venga el archivo

//   cloudinary.uploader.upload(req.file.path, (error, result) => {
//     if (error) {
//       return res.status(500).send(error);
//     }

//     console.log(
//       "La URL donde se ha guardado la imagen en Cloudinary es:",
//       result.url
//     );

//     res.json({
//       success: true,
//       imageUrl: result.url,
//     });
//   });
// });

// // endpoint 2 subir múltiples archivos

// app.post("upload-multiple", upload.array("files", 3), async (req, res) => {
//   if (!req.files) {
//     return res.status(400).send("No files uploaded");
//   }

//   // subimos cada archivo a Cloudinary

//   const urls = [];

//   for (const file of req.files) {
//     // por cada archivo del array hacemos una subida
//     try {
//       const result = await cloudinary.uploader(file.path);
//       urls.push(result.url);
//     } catch (error) {
//       console.log(error);
//       return res.status(500).send(error);
//     }
//   }

//   res.send(urls);
// });

// uploadDocument: async (req, res) => {
//   console.log("estás haciendo el upload de un documento");

//   try {
//     upload.any()(req, res, function (err) {
//       if (err instanceof multer.MulterError) {
//         return res.status(500).json(err);
//       } else if (err) {
//         return res.status(500).json(err);
//       }

//       if (!req.files) {
//         return res.status(400).json({
//           status: false,
//           message: "No se ha subido ningún archivo",
//         });
//       }

//       let data = [];

//       // let data = req.files.map((file) => file.filename);

//       // req.files es un array que contiene información sobre los archivos que fueron
//       // subidos en la solicitud. Cada elemento del arreglo es un objeto que representa
//       // un archivo. Este array existe porque multer ha procesado los archivos adjuntos

//       // req.files = [
//       //     { filename: '1234567890-archivo1.txt', originalname: 'archivo1.txt', ... },
//       //     { filename: '0987654321-archivo2.png', originalname: 'archivo2.png', ... }
//       //   ];

//       // data = ['1234567890-archivo1.txt', '0987654321-archivo2.png';

//       // Recorremos los archivos que nos vienen

//       req.files.map((file) => {
//         data.push(file.filename);
//         //de todo lo que viene en la request hacemos un push del contenido al array data
//       });

//       return res.send({
//         success: true,
//         message: "archivo subido con éxito",
//         data: data,
//       });
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send(error);
//   }
// },
