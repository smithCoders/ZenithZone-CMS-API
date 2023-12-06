const mongoose=require("mongoose");
const{Schema, model}=mongoose;
const reviewSchema=Schema({
review:{
    type:String,
    required:[true,"article must have review"]
},
rating:{type:Number, 
    min:1,
     max:5},
createdAt:
{type:Date, 
    default:Date.now()},
user:{type:Schema.Types.ObjectId, 
    ref:"User",
required:[true,"reviews must have author"]},
content:{type:Schema.Types.ObjectId,
        ref:"Content",
        required:[true,"rating must be beongs to written  content "]
}
});
// prevent duplicate review.
reviewSchema.index({user:1, content:1},{unique:true});
// calculate average rating
reviewSchema.statics.calcAverageRating=async function(contentId){
    const stats=await this.aggregate([
        // 1. select all reviews corresponds to current document.
        {$match:{content:contentId}},
        {$group:{_id:"$content", nRating:{$sum:1}, avgRating:{$avg:"$rating"}}}
    ]);
    if(stats.length>0){
        await this.model("Content").findByIdAndUpdate(contentId,{
            ratingsQuantity:stats[0].nRating,
            ratingsAverage:stats[0].avgRating
        });
    }else{
        await this.model("Content").findByIdAndUpdate(contentId,{
            ratingsQuantity:0,
            ratingsAverage:4.5
        });
    }
};
// update average rating after save
reviewSchema.post("save",function(){
    this.constructor.calcAverageRating(this.content);
});
// update average rating after update and delete
reviewSchema.pre(/^findOneAnd/,async function(next){
    this.r=await this.findOne();
    next();
});
reviewSchema.post(/^findOneAnd/,async function(){
    await this.r.constructor.calcAverageRating(this.r.content);
});
const Review=model(reviewSchema,"Review");
module.exports=Review;