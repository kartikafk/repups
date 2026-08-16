import mongoose from "mongoose";
export default mongoose.model("CoachMessage",new mongoose.Schema({userId:{type:String,required:true,index:true},message:String,mode:{type:String,enum:["mock","live"],default:"mock"},createdAt:{type:Date,default:Date.now}}));
