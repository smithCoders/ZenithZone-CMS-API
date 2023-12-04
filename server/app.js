const  express=require("express");
const userRouter=require("./src/Routes/userRoute");
const AppError=require("./src/utils/appError")
const app=express();
// body-parser.
app.use(express.json({limit:"50mb"}));
app.use("/api/v1",userRouter);
// url not found.
app.use("*",(req,res,next)=>{
    return  next(new AppError(`page not found${req.originalUrl}`));
})
module.exports=app;