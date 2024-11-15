const express = require("express");
const userController = require("../controllers/userController");
const auth = require("../middlewares/auth");

// Declaro un router
const userRouter = express.Router();

// defino las rutas

userRouter.get("/", auth.validateToken, userController.getUsers);
userRouter.post("/findUserByEmail", userController.findUserByEmail);
// userRouter.get("/profile/:userId", userController.getUsers);
userRouter.post("/register", userController.addUser);
//quito el middleware para ver si funciona la ruta de addUser
// router.post("/", auth.completeUserInfo, userController.addUser);
// userRouter.post("/register", userController.registerUser);
userRouter.post("/login", userController.userLogin);
userRouter.get("/profile", auth.validateToken, userController.getUserProfile);
// Ruta para solicitar recuperación de contraseña
userRouter.post("/recuperatePassword", userController.recuperatePassword);
// Ruta para restablecer la contraseña con el token
userRouter.post("/resetPassword/:token", userController.resetPassword);
userRouter.put("/update",auth.validateToken, auth.isAdmin, userController.updateUser); // quiero que primero se valide el token y luego verificar si el usuario es admin para que haga cambios
userRouter.get("/email/:email", auth.validateToken, auth.isAdmin, userController.getUserByEmail);
userRouter.delete("/delete", auth.isAdmin, userController.deleteUser);




module.exports = userRouter;
