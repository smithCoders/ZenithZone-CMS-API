const crypto=require("crypto")
const User=require("../model/userModel");
const AppError=require("../utils/appError")
const jwt=require("jsonwebtoken");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");
const sendEmail=require("../utils/sendEmail")
const path=require("path");
const ejs=require("ejs");
const  BlacklistToken=require("../model/blacklisted_tokens");



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
   


};
// Middleware for handling token expiration.
const getTokenFromHeader = (req) => {
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        return req.headers.authorization.split(" ")[1];
    }
    return null;
}
// Middleware to check if the token is blacklisted
exports.checkTokenBlacklist = catchAsync(async (req, res, next) => {
  const token = req.token;

  const isBlacklisted = await BlacklistToken.exists({ token });

  if (isBlacklisted) {
    return res.status(401).json({ status: 'failed', message: 'Token is blacklisted' });
  }

  // Token is not blacklisted, proceed to the next middleware
  next();
});

// Generate a random OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.signUp=catchAsync(async(req,res,next)=>{

    const {firstName,lastName,email,password,passwordConfirm,role}=req.body;
    const isEmailExist=await User.findOne({email});
    if(isEmailExist){
        // return next(new AppError("user already exist",400))
res.status(400).json({status:"fail",message:"user already exist"})  

    };
    const otp=generateOTP();
    const otpExpire=Date.now()+20*60*1000;

    const user=await User.create({
        firstName,
        lastName,
        email,
        password,
        passwordConfirm,
        role, 
        otp,
         isVerified:false,
         otpExpire});
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
exports.activateAccount = catchAsync(async(req, res, next) => {
    const { otp, email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ status: "failed", message: "user not found" });
    }

    // Convert both to String before comparing
    if (otp.toString() !== user.otp.toString()) {
        return res.status(400).json({ status: "failed", message: "Invalid OTP" });
    }
    if(user.otpExpire < Date.now()){
        return res.status(400).json({ status: "failed", message: "OTP expired" });
    }
    

    if (user.isVerified) {
        return res.status(400).json({ status: "failed", message: "your account is already verified" });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save({ validateBeforeSave: false });

    const data = {
        user: { firstName: user.firstName, email: user.email },
        supportEmail: "support@zenithzone.com"
    }

    await sendEmail({
        email: user.email,
        subject: "Account activated",
        template: "welcome_email.ejs",
        data
    });

    res.status(200).json({
        status: "success",
        message: "your account is activated successfully"
    });
});


// login
exports.login = catchAsync(async (req, res, next) => {
    const { emailOrUsername, password } = req.body;
    // Check if emailOrUsername and password are provided
if (!emailOrUsername || !password) {
    // return next(new AppError("please provide email or password", 400));
    res.status(400).json({status:"failed", 
    message:"please provide us your login credentials"})
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
exports.logout=catchAsync(async(req,res,next)=>{
    const  token=req.token;
    // Add the token to the blacklisted_tokens collection
    await BlacklistToken.create({token});
     // Clear server-side session
  req.session.destroy((err) => {
    if (err) {
      console.log('Error while destroying session', err);
      return res.status(500).json({ status: 'failed', message: 'Logout failed' });
    }

    // Clear token session
    res.clearCookie('jwt');
    res.status(200).json({ status: 'success', message: 'Logout successful' });
  });
})

// protected routes.
exports.isAuthorized = catchAsync(async(req, res, next) => {
    const token = getTokenFromHeader(req);

    if (!token) {
        return  res.status(401).json({status:"failed", message:"you are not logged in, please login to access"})
        
        // next(new AppError("You are not logged in, please login to access", 401));
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded?.id);
    if (!currentUser) {
        return  res.status(400).json({status:"failed", message:"User belonging to this token no longer exists"})
        // next(new AppError("User belonging to this token no longer exists", 400));
    }

    req.user = currentUser;
    next();
});
// restricted  middleware.
exports.restrictedTo=function(...roles){
    return function(req,res,next){
        if(!roles.includes(req.user.role)){
            return res.status(403).json({status:"failed", message:"you are  not allowed  to use thir  route"})
            //  next(new AppError("you are not allowed to use this route",403))
        };
        next()
    }
}
// forgot password,
exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1. find user based on the provided email.
    const { email } = req.body;
    const user = await User.findOne({ email });
    // 2. check if the user is registered.
    if (!user) {
        return   res.status(404).json({status:"failed", message:"user not found"});
        // next(new AppError("User not found", 404));
    }
    // 3. send password reset generator token.
    const resetToken = user.getResetPasswordToken();
    // 4. deactivate validation before saving user.
    await user.save({ validateBeforeSave: false });
    // 5. construct resetURL.
    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/user/resetpassword/${resetToken}`;

    // 6. Send the reset password email
    const data = {
        user: { firstName: user.firstName, email, resetURL },
        supportEmail: "supportEmail@zenithzone-cms.com"
    };
    
    
    await sendEmail({
        email,
        subject: "Password Reset",
        template: "reset_password_email.ejs",
        data
    });

    res.status(200).json({
        status: "success",
        message: "Password reset token sent to email.",
        resettoken:resetToken
    });
});
exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1. Find user who has this token (i.e., user who accepted this token via email).
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    // 2. If the token is expired or user not found, return an error.
    if (!user) {
        return res.status(400).json({ status: "failed", message: "Invalid or expired token" });
    }

    // 3. Set the new password and clear the password reset fields.
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    // Validate the user model
    try {
        await user.validate();
    } catch (validationError) {
        return res.status(400).json({ status: "fail", message: validationError.message });
    }

    // Save the user and handle success
    try {
        await user.save();
        // Redirect the user to the login page after successful password reset.
        res.redirect('/login');
    } catch (saveError) {
        console.error(saveError);
        return res.status(500).json({ status: "fail", message: "Unable to reset password. Please try again later." });
    }
});

// update password.
exports.updatePassword=catchAsync(async(req,res,next)=>{
    // 1. get user  from DB.
    const user=await User.findById(req?.user?.id).select("+password");
// 2. check if the password entered by user is correct.
if(!user || !(await user.comparePassword(req.body?.currentPassword))){
    return  res.status(401).json({status:"failed",message:"Incorrect password"})
    // next(new AppError("your current  password isn't correct",401));
};
// check if the new password is the same as the previous one.
if(req.body.newPassword===req.body.currentPassword){
   return res.status(400).json({ status: "failed", message: "New password must be different from the current password" });
}
// 3. update the password.

 user.password = req.body.newPassword;
    user.passwordConfirm = req.body.newPasswordConfirm;
await user.save();
// 4. log user automatically.
createSendToken(user,200,res);
});
