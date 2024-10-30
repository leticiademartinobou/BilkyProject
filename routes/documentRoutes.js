const express = require("express");
const documentController = require("../controllers/documentController");
const auth = require("../middlewares/auth");
const multer = require("multer");

// Declaro un router
const documentRouter = express.Router();
const upload = multer({ dest: "uploads" });

// defino las rutas

documentRouter.get(
  "/",
  auth.validateToken,
  auth.isAdmin,
  documentController.getDocuments
);
documentRouter.post(
  "/upload",
  upload.single("file"),
  documentController.uploadDocument
);
documentRouter.put(
  "/updateName",
  auth.validateToken,
  auth.isAdmin,
  documentController.updateDocumentName
);
documentRouter.delete(
  "/deleteDocument",
  auth.validateToken,
  auth.isAdmin,
  documentController.deleteDocument
);

module.exports = documentRouter;
