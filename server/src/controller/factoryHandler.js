const catchAsync=require("../utils/catchAsync");
const AppError=require("../utils/appError");
// get All Endpoint.
exports.getAll=Model=>catchAsync(async(req,res,next)=>{
    const doc=await Model.find();
    if(!doc){
        return next(new AppError("document not found",404));
    }
    res.status(200).json({status:"success",result:doc.length, data:{doc}})

})
exports.getOne=Model=>catchAsync(async(req,res,next)=>{
    const {id}=req.params.id;
    const doc=await Model.findById(id);
    if(!doc){
        return next(new AppError("document not found",404))
    }
    res.status(200).json({status:"success", data:{doc}})
});
exports.deleteOne=Model=>catchAsync(async(req,res,next)=>{
    const id=req.params.id;
    const  doc=await Model.findByIdAndDelete(id);
    if(!doc){
        return next(new AppError("document not found",404));
    }
    res.staus(200).json({status:"success", data:null})
});
exports.createOne=  Model=>catchAsync(async(req,res,next)=>{
    const doc=await Model.create(req.body);
    res.status(201).json({status:"success", data:{doc}})
});
exports.updateOne=Model=>catchAsync(async(req,res,next)=>{
    const doc=await Model.findByIdAndUpdate(req.params.id,req.body,{new:true, runValidators:true});
    if(!doc){
        return next(new AppError("document not found",404));
    };
    res.status(200).json({status:"success", data:{doc}});
})
