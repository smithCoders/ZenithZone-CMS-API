const express=require("express");
const authController=require("../controller/authConrtoller");
const contentController=require("../controller/contentController")
const router=express.Router();

router.route("/content/:id").get(contentController.getContentById);
router.route("/content/").get(contentController.getAllContent);
router.use(authController.isAuthorized, authController.restrictedTo("admin"));
// ADMIN-------only
router.route("/content/").post(contentController.createContent);
router.route("/content/:id").patch(contentController.updateContent).delete(contentController.deleteContent)

module.exports=router;