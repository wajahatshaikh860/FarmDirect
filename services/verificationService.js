import User from "../models/User.js";
import {connectDB} from "../lib/db.js";
import {requireProductRole} from "../lib/productPermissions.js";
import {ProductError} from "../lib/productErrors.js";
import {objectId} from "../validators/cartValidator.js";
import {parseCommerce,serializeCommerce} from "../lib/commerce.js";
import {saveNotifications} from "./notificationService.js";
import {z} from "zod";
const changes=z.object({verificationStatus:z.enum(["VERIFIED","REJECTED"])}).strict();
export async function getFarmers(user) {
 requireProductRole(user,["ADMIN"]);await connectDB();
 return serializeCommerce(await User.find({role:"FARMER"}).select("name email phone farmerProfile address createdAt verificationStatus").sort({createdAt:-1,_id:-1}).limit(200).lean());
}
export async function verifyFarmer(user,id,input) {
 requireProductRole(user,["ADMIN"]);parseCommerce(objectId,id);const value=parseCommerce(changes,input);await connectDB();
 const farmer=await User.findOneAndUpdate({_id:id,role:"FARMER",verificationStatus:"PENDING"},{$set:value},{new:true,runValidators:true}).select("name verificationStatus").lean();
 if(!farmer){
  if(!await User.exists({_id:id,role:"FARMER"}))throw new ProductError("Farmer not found",404);
  throw new ProductError("Only pending farmers can be verified or rejected",400);
 }
 const approved=value.verificationStatus==="VERIFIED";
 // Best-effort insertion occurs after the authoritative verification write.
 await saveNotifications([{user:id,type:"VERIFICATION_"+value.verificationStatus,title:approved?"Farmer verification approved":"Farmer verification rejected",message:approved?"Your farm now displays the verified trust badge.":"Your verification was rejected. You can still manage and sell your products.",link:"/farmer/dashboard",eventKey:"verification:"+id+":"+value.verificationStatus+":"+Date.now()}]);
 return {success:true,farmer:serializeCommerce(farmer)};
}
