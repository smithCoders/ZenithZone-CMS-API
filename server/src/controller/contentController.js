const Content=require("../model/contentModel");
const catchAsync=require("../utils/catchAsync");
const AppError=require("../utils/appError");
const factory=require("./factoryHandler");
 exports.updateMe=catchAsync(async(req,res,next)=>{
        // 1. create error if user post password data
        if(req.body.password || req.body.passwordConfirm){
            return next(new AppError("this route is not for password update",400));
        }
        // 2. update user document
        const updatedContent=await Content.findByIdAndUpdate(req.params.id,req.body,{
            new:true,
            runValidators:true
        });
        res.status(200).json({
            status:"success",
            data:{
                content:updatedContent
            }
        });
    }
);

 exports.createContent=factory.createOne(Content);
 exports.updateContent=factory.updateOne(Content);
 exports.getAllContent=factory.getAll(Content);
 exports.getContentById=factory.getOne(Content);
 exports.deleteContent=factory.deleteOne(Content);