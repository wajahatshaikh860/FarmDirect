import Notification from "../models/Notification.js";
import Order from "../models/Order.js";
import {connectDB} from "../lib/db.js";
import {requireProductRole} from "../lib/productPermissions.js";
import {parseCommerce,serializeCommerce} from "../lib/commerce.js";
import {objectId} from "../validators/cartValidator.js";
import {ProductError} from "../lib/productErrors.js";
const roles=["BUYER","FARMER","ADMIN"];
export async function saveNotifications(events) {
 try{await connectDB();await Notification.bulkWrite(events.map(event=>({updateOne:{filter:{eventKey:event.eventKey},update:{$setOnInsert:event},upsert:true}})));}
 catch {console.error("Phase 4 notification delivery failed");}
}
export async function notifyNewOrders(ids) {
 try {
 await connectDB();const orders=await Order.find({_id:{$in:ids}}).lean();
 await saveNotifications(orders.map(order=>({user:order.farmer,type:"NEW_ORDER",title:"New order",message:"A buyer placed an order for your products.",link:"/farmer/orders/"+order._id,eventKey:"new-order:"+order._id})));
 }catch{console.error("Phase 4 new-order notification failed");}
}
export async function notifyOrderStatus(order) {
 const labels={ACCEPTED:"accepted",CANCELLED:"rejected",PACKED:"packed",SHIPPED:"shipped",DELIVERED:"delivered"};
 const label=labels[order.orderStatus];if(!label)return;
 await saveNotifications([{user:order.buyer?._id||order.buyer,type:"ORDER_"+order.orderStatus,title:"Order "+label,message:"Your order has been "+label+".",link:"/buyer/orders/"+order._id,eventKey:"order-status:"+order._id+":"+order.orderStatus}]);
}
export async function getNotifications(user) {
 requireProductRole(user,roles);await connectDB();
 const [notifications,unread]=await Promise.all([Notification.find({user:user.id}).sort({createdAt:-1,_id:-1}).limit(50).lean(),Notification.countDocuments({user:user.id,isRead:false})]);
 return {notifications:serializeCommerce(notifications),unread};
}
export async function readNotifications(user,id) {
 requireProductRole(user,roles);if(id)parseCommerce(objectId,id);await connectDB();
 if(id){
  const notification=await Notification.findById(id).select("user").lean();
  if(!notification)throw new ProductError("Notification not found",404);
  if(String(notification.user)!==String(user.id))throw new ProductError("Forbidden",403);
  await Notification.updateOne({_id:id,user:user.id},{$set:{isRead:true}});
 }
 else await Notification.updateMany({user:user.id,isRead:false},{$set:{isRead:true}});
 return {success:true};
}
