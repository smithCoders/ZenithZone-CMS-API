const User=require("../model/userModel");
const AppError=require("../utils/appError");
const jwt=require("jsonwebtoken");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");
// generate jwt token.
const signToken=(id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    })
}
const createSendToken=(user,statusCode,res)=>{
    const token=signToken(user._id);
    const cookieOptions={
        expires:new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
        httpOnly:true
    }
    if(process.env.NODE_ENV==="production") cookieOptions.secure=true;
    res.cookie("jwt",token,cookieOptions);
    user.password=undefined;
    res.status(statusCode).json({
        status:"success",
        token,
        data:{
            user
        }
    })
   


}
// Generate a random OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.signUp=catchAsync(async(req,res,next)=>{
    const {firstName,lastName,email,password,passwordConfirm,role}=req.body;
    const isEmailExist=await User.findOne({email});
    if(isEmailExist){
        return next(new AppError("user already exist",400));
    };
    const user=await User.create({firstName,lastName,email,password,passwordConfirm,role});
    createSendToken(user,201,res);
})
// login
exports.login = catchAsync(async (req, res, next) => {
    const { emailOrUsername, password } = req.body;
    // Check if emailOrUsername and password are provided
if (!emailOrUsername || !password) {
    return next(new AppError("please provide email or password", 400));
}


    // Check if the user exists (using email or username)
    const user = await User.findOne({
        // $or: is mongo operator that accept  email or passord to query.
        $or: [{ email: emailOrUsername }, { userName: emailOrUsername }],
    }).select("+password");

    // Check if the user exists and the password is correct
    if (!user || !(await user.comparePassword(password))) {
        return next(new AppError("Incorrect email/username or password", 401));
    }
    createSendToken(user, 200, res);
});

// protected routes.
exports.isAuthorized=catchAsync(async(req,res,next)=>{
    // 1.getting  token  and check if it is their.
    let token;
    if(req.headers.authorization &&  req.headers.authorization.startWith("Bearer")){
token=req.headers.authorization.split(" ")[1]
    };
    // 2. if their is  no token return an error.
    if(!token){
        return next(new AppError("you are not loggedin please login to access",401))
    };
    // verify the token
    const decoded=await promisify(jwt.verify()(token, process.env.JWT_SECRET));
    // check if the user is still exist.
    const currentUser=await  User.findById(decoded?.id);
    if(!currentUser){
        return next(new AppError("user belonging to this  token no longer exist",400))
    };
    req.user=currentUser;
    next()
    

});
// restricted  middleware.
exports.restrictedTo=function(...roles){
    return function(req,res,next){
        if(!roles.includes(req.user.role)){
            return next(new AppError("you are not allowed to use this route",403))
        };
        next()
    }
}