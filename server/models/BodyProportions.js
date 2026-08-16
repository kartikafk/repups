import mongoose from "mongoose";
export default mongoose.model("BodyProportions",new mongoose.Schema({userId:{type:String,required:true,unique:true,index:true},torsoToLegRatio:Number,shoulderToHipRatio:Number,limbLengthRatio:Number,computedAt:{type:Date,default:Date.now}},{timestamps:true}));
