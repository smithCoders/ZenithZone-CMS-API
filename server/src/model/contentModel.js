const mongoose=require("mongoose");
const {Schema,model}=mongoose;
 const contentSchema=Schema({
   title:{type:String,required:[true,"title is required"],
    minlength:[10,"title must be at least 10 characters"],
    maxlength:[100,"title must be at most 100 characters"],
    trim:true,
    lowercase:true,
    unique:true,
},
description:{
    type:String,
    trim:true,
    minlength:[500,"description must be at least 500 characters"],
    required:[true,"content must have description"],
},
content:{
    type:String,
    trim:true,
    minlength:[500,"content must be at least 500 characters"],
    required:[true,"content must have content"],
},
 image: {
        type: String,
        required: [true, "Content must have an image"],
        validate: {
            validator: (value) => {
                // Validate that the image is a URL
                const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
                return urlRegex.test(value);
            },
            message: "Invalid image URL",
        },
    },
createdAt:{
    type:Date,
    default:Date.now()
},
updatedAt:{
    type:Date,
    // default:Date.now()
},
author:{
    type:Schema.Types.ObjectId,
    ref:"User",
    required:[true,"content must have author"]
},
category:{
    type:Schema.Types.ObjectId,
    ref:"Category",
    required:[true,"content must have category"]
},
 ratingsAverage: {
      type: Number,
      min:[1,"rating must be   greater than 1"],
      max:[5.0,"rating must be below  5.0"],
      // rounding avg  rating value.  the setter  fucntion  run whenever their  is  new  value  is added.
      set:val=>Math.round(val*10)/10
   
    },
     ratingsQuantity: {
      type: Number,
      default: 0,
    },
tags:[{
    type:Schema.Types.ObjectId,
    ref:"Tag",
    required:[true,"content must have tags"]
}],
// comments:[{
//     type:Schema.Types.ObjectId,
//     ref:"Comment",
//     required:[true,"content must have comments"]
// }],
views:{
    type:Number,
    default:0
},
likes:{
    type:Number,
    default:0
},
dislikes:{
    type:Number,
    default:0
},
status:{
    type:String,
    enum:["draft","published"],
    default:"draft"
},

 });
 const Content=model(contentSchema,"Content");
 module.exports=Content;