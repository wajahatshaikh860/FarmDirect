import mongoose from "mongoose";
import Review from "../models/Review.js";
import Order from "../models/Order.js";
import "../models/User.js";
import {connectDB} from "../lib/db.js";
import {requireProductRole} from "../lib/productPermissions.js";
import {ProductError} from "../lib/productErrors.js";
import {parseCommerce,serializeCommerce} from "../lib/commerce.js";
import {objectId} from "../validators/cartValidator.js";
import {reviewCreate,reviewChanges} from "../validators/reviewValidator.js";
export function assertReviewEligibility(user,order,product) {
 requireProductRole(user,["BUYER"]);
 if(String(order.buyer?._id||order.buyer)!==String(user.id)) throw new ProductError("Forbidden",403);
 if(order.orderStatus!=="DELIVERED") throw new ProductError("Only delivered orders can be reviewed",400);
 if(!order.items.some(item=>String(item.product?._id||item.product)===String(product))) throw new ProductError("Product is not in this order",400);
}
export function assertReviewOwner(user,review) {
 requireProductRole(user,["BUYER"]);
 if(String(review.buyer?._id||review.buyer)!==String(user.id)) throw new ProductError("Forbidden",403);
}
export async function createReview(user,input) {
 requireProductRole(user,["BUYER"]); const value=parseCommerce(reviewCreate,input);await connectDB();
 const order=await Order.findById(value.order).lean();if(!order)throw new ProductError("Order not found",404);
 assertReviewEligibility(user,order,value.product);
 try{return serializeCommerce(await Review.create({...value,buyer:user.id,farmer:order.farmer}));}
 catch(e){if(e.code===11000)throw new ProductError("You already reviewed this product in this order. Edit your review.",409);throw e;}
}
export async function changeReview(user,id,input,remove=false) {
 requireProductRole(user,["BUYER"]);parseCommerce(objectId,id);
 const value=remove?null:parseCommerce(reviewChanges,input);await connectDB();
 const review=await Review.findById(id);if(!review)throw new ProductError("Review not found",404);
 assertReviewOwner(user,review);
 if(remove){await Review.deleteOne({_id:id,buyer:user.id});return {deleted:true};}
 review.rating=value.rating;review.comment=value.comment;await review.save();return serializeCommerce(review);
}
export async function orderReviews(user,order) {
 assertReviewEligibility(user,order,order.items[0]?.product);await connectDB();
 return serializeCommerce(await Review.find({buyer:user.id,order:order._id}).lean());
}
export async function ratingSummary(field,id) {
 if(!["product","farmer"].includes(field))throw new ProductError("Invalid rating scope",400);
 parseCommerce(objectId,String(id));await connectDB();
 const [summary]=await Review.aggregate([{$match:{[field]:new mongoose.Types.ObjectId(String(id))}},{$group:{_id:null,average:{$avg:"$rating"},count:{$sum:1}}}]);
 return {average:summary?.average||0,count:summary?.count||0};
}
export async function productReviews(id) {
 parseCommerce(objectId,id);await connectDB();
 const [summary,reviews]=await Promise.all([ratingSummary("product",id),Review.find({product:id}).populate("buyer","name").sort({createdAt:-1,_id:-1}).limit(50).lean()]);
 return {...summary,reviews:serializeCommerce(reviews)};
}
