import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Review from "../models/Review.js";
import {connectDB} from "../lib/db.js";
import {requireProductRole} from "../lib/productPermissions.js";
import {ratingSummary} from "./reviewService.js";
export async function dashboardAnalytics(user) {
 requireProductRole(user,["FARMER","BUYER","ADMIN"]);await connectDB();
 const id=new mongoose.Types.ObjectId(user.id);
 if(user.role==="ADMIN") {
 const [users,farmers,buyers,pending,verified,products,orders,value]=await Promise.all([
 User.countDocuments({}),User.countDocuments({role:"FARMER"}),User.countDocuments({role:"BUYER"}),User.countDocuments({role:"FARMER",verificationStatus:"PENDING"}),User.countDocuments({role:"FARMER",verificationStatus:"VERIFIED"}),Product.countDocuments({}),Order.countDocuments({}),Order.aggregate([{$match:{orderStatus:"DELIVERED"}},{$group:{_id:null,value:{$sum:"$totalAmount"}}}])]);
 return {users,farmers,buyers,pendingVerification:pending,verifiedFarmers:verified,products,orders,value:value[0]?.value||0};
 }
 const scope={[user.role==="FARMER"?"farmer":"buyer"]:id};
 const [orders,pending,delivered,money]=await Promise.all([Order.countDocuments(scope),Order.countDocuments({...scope,orderStatus:"PENDING"}),Order.countDocuments({...scope,orderStatus:"DELIVERED"}),Order.aggregate([{$match:{...scope,orderStatus:"DELIVERED"}},{$group:{_id:null,value:{$sum:"$totalAmount"}}}])]);
 if(user.role==="FARMER") {
 const [products,active,outOfStock,rating,farmer]=await Promise.all([Product.countDocuments({farmer:id}),Product.countDocuments({farmer:id,status:"ACTIVE"}),Product.countDocuments({farmer:id,status:"OUT_OF_STOCK"}),ratingSummary("farmer",user.id),User.findById(id).select("verificationStatus").lean()]);
 return {products,active,outOfStock,orders,pending,delivered,revenue:money[0]?.value||0,rating:rating.average,ratingCount:rating.count,verificationStatus:farmer?.verificationStatus};
 }
 const [cart,reviews]=await Promise.all([Cart.findOne({buyer:id}).select("items").lean(),Review.countDocuments({buyer:id})]);
 return {orders,pending,delivered,spending:money[0]?.value||0,cartItems:cart?.items?.length||0,reviews};
}

