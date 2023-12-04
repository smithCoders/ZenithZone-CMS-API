const { mountpath } = require("../../app");
const authController=require("../controller/authConrtoller");
const express=require("express");
const router=express.Router();
router.route("/signup").post(authController.signUp);
router.route("/login").post(authController.login);
module.exports=router;