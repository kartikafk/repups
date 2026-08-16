import mongoose from "mongoose";
const schema=new mongoose.Schema({cohortKey:{type:String,required:true},feature:{type:String,required:true},stats:{mean:Number,std:Number,sampleCount:Number},lastComputedAt:{type:Date,default:Date.now}});schema.index({cohortKey:1,feature:1},{unique:true});export default mongoose.model("CohortRange",schema);
