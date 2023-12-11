const factory=require("./factoryHandler")
const User=require("../model/userModel");
const catchAsync = require("../utils/catchAsync");
const {createSendToken}=require("../utils/sendToken")
// filtered Object.
const filterObjet=(obj,...allowedField)=>{
const newObj={};
Object.keys(obj).forEach(el=>{
    if(allowedField.includes(el)) newObj[el]=obj[el];

})
return newObj;
}
// update-Me.(only for loggedin user)
exports.updateMe=catchAsync(async(req,res,next)=>{
//    if user try to update password throw  an error.
if(req.body.password || req.body.passwordConfirm){
    res.status(400).
    json({status:"failed",
    message:"you can't update  password in this route"});
};
const  filterdBody=filterObjet(req.body,"firstName","lastName","userName","email")

    const user=await User.findByIdAndUpdate(req.user?.id,filterObjet,{new:true,runValidators:true});
    createSendToken(user,200,res);

});
// soft-delete
exports.deleteMe=catchAsync(async(req,res,next)=>{
    await User.findByIdAndUpdate(req.user?.id,{isActive:false});
    res.status(204).
    json({status:"sucess",
    message:"your  account is inactive until  you  reactivate"});
});

// user reactivation
// exports.reactivateAccount = catchAsync(async (req, res, next) => {
//     // Find the user by ID, even if they are marked as inactive
//     console.log("req.user?.id:", req.user?.id);
//     const user = await User.findOne({
//         _id: req.user?.id,
     
//     });
//     // Check if the user exists
//     if (!user) {
//         return res.status(404).json({ status: "fail", message: "No user found with that ID" });
//     }

//     // Reactivate the user by setting isActive to true
//     user.isActive = true;
//     await user.save();

//     // Respond with a new token (optional)
//     createSendToken(user, 200, res);
// });


exports.getAllUser=factory.getAll(User);
exports.getOneUser=factory.getOne(User);
exports.CreateUser=factory.createOne(User);
exports.updateUser=factory.updateOne(User);
exports.deleteUser=factory.deleteOne(User);
