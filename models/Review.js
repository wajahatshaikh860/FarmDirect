import mongoose from "mongoose";
const ref = (model) => ({type:mongoose.Schema.Types.ObjectId,ref:model,required:true});
const schema = new mongoose.Schema({
 buyer:ref("User"),farmer:ref("User"),product:ref("Product"),order:ref("Order"),
 rating:{type:Number,required:true,min:1,max:5,validate:Number.isInteger},
 comment:{type:String,trim:true,maxlength:2000,default:""},
},{timestamps:true});
schema.index({buyer:1,order:1,product:1},{unique:true});
schema.index({product:1,createdAt:-1});schema.index({farmer:1});
export default mongoose.models.Review || mongoose.model("Review",schema);
