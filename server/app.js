const  express=require("express");
const userRouter=require("./src/Routes/userRoute");
const AppError=require("./src/utils/appError")
const session=require("express-session");
const app=express();
// body-parser.
app.use(express.json({limit:"50mb"}));
// Set up express-session middleware
app.use(
      session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
)

app.use("/api/v1",userRouter);
// url not found.
app.use("*",(req,res,next)=>{
    return  res.status(400).json({status:"failed",message:"page not found"})
    
    // next(new AppError(`page not found${req.originalUrl}`));
})
module.exports=app;