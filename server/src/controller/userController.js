const factory=require("./factoryHandler")
const User=require("../model/userModel");
exports.getAllUser=factory.getAll(User);
exports.getOneUser=factory.getOne(User);
exports.CreateUser=factory.createOne(User);
exports.updateUser=factory.updateOne(User);
exports.deleteUser=factory.deleteOne(User);
