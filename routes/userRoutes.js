const express = require("express");
const userController = require("../controllers/userController");
const auth = require("../middlewares/auth");

// Declaro un router
const userRouter = express.Router();

// defino las rutas

userRouter.get("/", auth.validateToken, userController.getUsers);
userRouter.get("/byEmail", userController.getUserByEmail);
userRouter.get("/profile/:userId", userController.getUsers);
userRouter.post("/", userController.addUser);
//quito el middleware para ver si funciona la ruta de addUser
// router.post("/", auth.completeUserInfo, userController.addUser);
// userRouter.post("/register", userController.registerUser);
userRouter.post("/login", userController.userLogin);
userRouter.post("/recuperatePassword", userController.recoverPassword);
userRouter.put("/update", auth.isAdmin, userController.updateUser);
userRouter.delete("/deleteUser", auth.isAdmin, userController.deleteUser);

module.exports = userRouter;
