const crypto=require("crypto")
const User=require("../model/userModel");
const AppError=require("../utils/appError")
const jwt=require("jsonwebtoken");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");
const sendEmail=require("../utils/sendEmail")
const path=require("path");
const ejs=require("ejs")
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
        return next(new AppError("user already exist",400))
    };
    const otp=generateOTP()
    const user=await User.create({
        firstName,
        lastName,
        email,
        password,
        passwordConfirm,
        role, 
        otp,
         isVerified:false});
        await user.save();
    // prepare data to sendEmail.
    const data={
        user:{firstName,email,otp, password},
        supportEmail:"supportEmail@zenithzone-cms.com"

    };
    const html=ejs.renderFile(path.join(__dirname,"../mails/activation_email.ejs"),data);
    // send email.
    try{
        await sendEmail({
            email,
            subject:"Account activation",
            template:"activation_email.ejs",
           data
        });
        res.status(200).json({
            status:"success",
            message:"account created successfully, please check your email to activate your account",
            otp:user.otp
        })
    } catch(err){
        console.log(err);
        res.status(500).json({  
            status:"fail",
            message:"something went wrong, please try again later"
        })
    }

});
exports.activateAccount=catchAsync(async(req,res,next)=>{
    // 1. get the otp from the user.
    const {otp,email}=req.body;
    // 2. find the user based on the email
    const user=await User.findOne({email});
    // 3. check if the user is exist.
    if(!user){
        return next(new AppError("user not found",404))
    };
    // check if the otp  is valid.
    if(otp===user.otp){
        return next
    }
    // 4. check if the user is already verified.
    if(user.isVerified){
        return next(new AppError("your account is already verified",400))
    };
    // 5. verify the user.
    user.isVerified=true;
    user.otp=undefined;
    await user.save({validateBeforeSave:false});
    // 6. send welcome email.
    const data={
        user:{firstName:user.firstName,email:user.email},
        supportEmail:"support@zenithzone.com"

    }
    await sendEmail({
        email:user.email,
        subject:"Account activated",
        template:"welcome_email.ejs",
        data
    });
    // 7. send response.
    res.status(200).json({
        status:"success",
        message:"your account is activated successfully"
    })
}
);


// login
exports.login = catchAsync(async (req, res, next) => {
    const { emailOrUsername, password } = req.body;
    // Check if emailOrUsername and password are provided
if (!emailOrUsername || !password) {
    return next(new AppError("please provide email or password", 400));
}


    // Check if the user exists (using email or username)
    const user = await User.findOne({
        // $or: is mongo operator that accept  email or password to query.
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
// forgot password,
exports.forgotPassword=catchAsync(async(req,res,next)=>{
    // 1. find ser based on the provided email.
    const{email}=req.body;
    const user=await User.findOne({email});
    // 2. check if the  user is registered.
    if(!user){
        return next(new AppError("user not found",404))
    };
    // 3.  send password reset generator tokne.
    const otp=user.getResetPasswordOTP();
    // 4. deactivate validation   before saving user.
    await user.save({validateBeforeSave:false});
// 5. construct resetURL.
const resetURL=`${req.protocol}://${req.get("host")}/api/v1/user/resetpassword/${otp}`;
// sedning email implemented here.--------------------------

});
exports.resetPassword=catchAsync(async(req,res,next)=>{
// 1. find user who  have this token(mean user who  accept this token via email).
const hashedToken=crypto.createHash("sha256").update(req.params.token).digest("hex");
const user=await User.findOne({resetPasswordToken:hashedToken
    ,resetPasswordExpire:{$gt:Date.now()}

});
// 2.if the token expired(mean no user  found on the DB)
if(!user){
    return next(new AppError("invalid or expired token",400))
}
// 3. Set the new password and clear the password reset fields.
user.password=req.body.password;
user.passwordConfirm=req.body.passwordConfirm;
user.resetPasswordToken=undefined;
user.resetPasswordExpire=undefined;
await user.save();
createSendToken(user,200,res);
});
// update password.
exports.updatePassword=catchAsync(async(req,res,next)=>{
    // 1. get user  from DB.
    const user=await User.findById(req.user?.id).select("+password");
// 2. check if the password entered by user is correct.
if(!user || !(await user.comparePassword(req.user?.currentPassword))){
    return next(new AppError("your current  password isn't correct",401));
};
// 3. update the password.
user.password=req.user.password;
user.passwordConfirm=req.user.passwordConfirm;
await user.save();
// 4. log user automatically.
createSendToken(user,200,res);
})