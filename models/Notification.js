import mongoose from "mongoose";
const schema = new mongoose.Schema({
 user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
 type:{type:String,required:true},title:{type:String,required:true,maxlength:150},
 message:{type:String,required:true,maxlength:500},link:{type:String,required:true,maxlength:300},
 isRead:{type:Boolean,default:false},eventKey:{type:String,required:true,unique:true},
},{timestamps:{createdAt:true,updatedAt:false}});
schema.index({user:1,createdAt:-1});schema.index({user:1,isRead:1});
export default mongoose.models.Notification || mongoose.model("Notification",schema);
