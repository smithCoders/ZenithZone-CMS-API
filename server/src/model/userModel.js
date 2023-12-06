const mongoose=require("mongoose");
const {model, Schema}=mongoose;
const bcrypt=require("bcryptjs");
const crypto=require("crypto");
const validator=require("validator")
const userSchema=Schema({
    firstName:{
        type:String,
        required:[true,"Please enter your first name"],
        maxlength:[30,"Your name cannot exceed 30 characters"],
        minlength:[4,"Your name must be longer than 4 characters"],
        trim:true,
    },
    lastName:{
        type:String,
        required:[true,"Please enter your last name"],
        maxlength:[30,"Your name cannot exceed 30 characters"],
        minlength:[4,"Your name must be longer than 4 characters"],
        trim:true

    },
    userName:{
        type:String,
        lowercase:true,
        unique:true,
        trim:true,
    },
    email:{
        type:String,
        required:[true,"Please enter your email"],
        unique:true,
        lowercase:true,
        trim:true,
        validate:[validator.isEmail, "Please enter a valid email address"]
    },
    password:{
        type:String,
        required:[true,"Please enter your password"],
        minlength:[6,"Your password must be longer than 6 characters"],
        select:false
    },
    passwordConfirm:{
        type:String,
        required:[false,"Please confirm your password"],
        validate:{
            // this only works on CREATE and SAVE!!!
        validator:function(el){
            return el===this.password;
        },
            message:"Passwords are not the same!"
        }
    },

    role:{
        type:String,
        default:"user",
        enum:{
            values:["user","admin"],
            message:"Please select correct role"
        }

    },
    createdAt:{
type:Date,
default:Date.now
    },
    avatar:{
        public_id:{
            type:String,
            // required:true
        },
        url:{
            type:String,
            // required:true
        }
    },
   
    resetPasswordToken:String,
    resetPasswordExpire:Date,
    isActive:{
        type:Boolean,
        default:true,
        select:false,

    },
    isVerified:{
        type:Boolean,
        default:false,
        select:false,
    },
    otp:String,
},{
    timeStamps:true
}
);
// crate joi validation for user
// const userJoiValidation=joi.object({
//     firstName:joi.string().required(),
//     lastName:joi.string().required(),
//     email:joi.string().email().required(),
//     password:joi.string().required()
// }
// );

// validate data before  save user
// userSchema.pre('save', async function (next) {
//   try {
//     const value = await userJoiValidation.validateAsync(this.toObject());
//     next();
//   } catch (error) {
//     next(error);
//   }
// });
// pre-save middleware to generate userName
userSchema.pre("save",function(next){
    // generate username only if it doesn't  exist
    if(!this.userName){
       const firstNameLetter=this.firstName[0].toLowerCase();
       const   fatherName=this.lastName.toLowerCase();
       this.userName=`${firstNameLetter}${fatherName}`

    }
    next();
})
// logging middleware  when user  signup.
userSchema.pre("save", function(next){
    // check if the document created is New.
    if(this.isNew){
    console.log(`user: ${this.firstName}, with email: ${this.email}  at date: ${this.createdAt}  signed up`);
    }
    next()
})
// encrypting password before saving user
userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        next();
    }
    this.password=await bcrypt.hash(this.password,12);
    this.passwordConfirm=undefined;
    next();
}
);
// compare user password
userSchema.methods.comparePassword=async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password);
};

// generate password resetToken
userSchema.methods.getResetPasswordToken=function(){
    // generate token
    const resetToken=crypto.randomBytes(32).toString("hex")
    // hash the token (encrypt it).
    this.resetPasswordToken=crypto.createHash("sha256").update(resetToken).digest("hex");
    // set token expire time(30 min)
    this.resetPasswordExpire=Date.now()+30*60*1000;
    return resetToken;
}
const User=model("User",userSchema);
module.exports=User
