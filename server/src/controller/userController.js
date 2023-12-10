const factory=require("./factoryHandler")
const User=require("../model/userModel");
const catchAsync = require("../utils/catchAsync");
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
exports.deleteMe=catchAsync(async(req,res,next)=>{
    await User.findByIdAndUpdate(req.user?.id,{isActive:false});
    res.status(204).
    json({status:"sucess",
    message:"your  account is inactive until  you  reactivate"});
})
exports.getAllUser=factory.getAll(User);
exports.getOneUser=factory.getOne(User);
exports.CreateUser=factory.createOne(User);
exports.updateUser=factory.updateOne(User);
exports.deleteUser=factory.deleteOne(User);
