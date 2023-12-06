
const authController=require("../controller/authConrtoller");
const userController=require("../controller/userController");
const express=require("express");
const router=express.Router();
router.route("/signup").post(authController.signUp);
router.route("/verify").post(authController.activateAccount);
router.route("/login").post(authController.login);
router.route("/forgotPassword").post(authController.forgotPassword);
router.route("/resetPassword/:token").patch(authController.resetPassword);
router.route("/updatePassword").patch(authController.isAuthorized,authController.updatePassword);

// ADMIN------ONLY.
router.route("/user").get(authController.isAuthorized,userController.getAllUser).post(userController.CreateUser);
router.route("/user/:id").get(authController.isAuthorized, 
    userController.getOneUser).
    patch(authController.isAuthorized,
         userController.updateUser)
module.exports=router;