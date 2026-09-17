import test,{beforeEach,afterEach,mock} from "node:test";
import assert from "node:assert/strict";
import Review from "../models/Review.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import {assertReviewEligibility,assertReviewOwner,createReview,changeReview} from "../services/reviewService.js";
import {saveNotifications,readNotifications,getNotifications} from "../services/notificationService.js";
import {verifyFarmer} from "../services/verificationService.js";
import {forwardGeocode,validCoordinates,publicProduct} from "../lib/farmLocation.js";
import {apiJSON} from "../lib/phase4Client.js";
const buyer={id:"507f1f77bcf86cd799439021",role:"BUYER"},other={id:"507f1f77bcf86cd799439022",role:"BUYER"},farmer={id:"507f1f77bcf86cd799439023",role:"FARMER"};
const product="507f1f77bcf86cd799439024",orderId="507f1f77bcf86cd799439025",reviewId="507f1f77bcf86cd799439026";
const order={_id:orderId,buyer:buyer.id,farmer:farmer.id,orderStatus:"DELIVERED",items:[{product}]};
const query=value=>({select(){return this;},lean(){return this;},then(resolve,reject){return Promise.resolve(value).then(resolve,reject);}});
beforeEach(()=>{globalThis.farmdirectMongo.connection={};});
afterEach(()=>mock.restoreAll());
test("review eligibility rejects guest, farmer, another buyer, undelivered order and unpurchased product",()=>{
 assertReviewEligibility(buyer,order,product);
 for(const [user,record,id] of [[null,order,product],[farmer,order,product],[other,order,product],[buyer,{...order,orderStatus:"SHIPPED"},product],[buyer,order,reviewId]])assert.throws(()=>assertReviewEligibility(user,record,id));
});
test("review create derives buyer/farmer from delivered order and duplicate becomes conflict",async()=>{
 mock.method(Order,"findById",()=>query(order));let saved;
 mock.method(Review,"create",async value=>{saved=value;return value;});
 await createReview(buyer,{order:orderId,product,rating:5,comment:" Fresh "});
 assert.equal(saved.buyer,buyer.id);assert.equal(saved.farmer,farmer.id);assert.equal(saved.comment,"Fresh");
 mock.method(Review,"create",async()=>{throw Object.assign(new Error(),{code:11000});});
 await assert.rejects(createReview(buyer,{order:orderId,product,rating:5}),e=>e.status===409);
});
test("review updates reject forged ownership and immutable relationship fields",async()=>{
 const review={buyer:buyer.id,rating:4,comment:"",save:async()=>review};mock.method(Review,"findById",()=>query(review));
 assert.throws(()=>assertReviewOwner(other,review),e=>e.status===403);
 await assert.rejects(changeReview(other,reviewId,{rating:2}),e=>e.status===403);
 await assert.rejects(changeReview(farmer,reviewId,null,true),e=>e.status===403);
 for(const field of ["buyer","farmer","product","order","$set"])await assert.rejects(changeReview(buyer,reviewId,{rating:2,[field]:other.id}));
 await changeReview(buyer,reviewId,{rating:2,comment:"Updated"});assert.equal(review.rating,2);
});
test("review delete binds write to owner and unique index includes buyer/order/product",async()=>{
 mock.method(Review,"findById",()=>query({buyer:buyer.id}));let filter;
 mock.method(Review,"deleteOne",async value=>{filter=value;return {};});
 await changeReview(buyer,reviewId,null,true);assert.deepEqual(filter,{_id:reviewId,buyer:buyer.id});
 assert(Review.schema.indexes().some(([keys,opts])=>opts.unique&&keys.buyer&&keys.order&&keys.product));
});
test("reviews reject noninteger/out-of-range ratings and oversized comments",async()=>{
 for(const rating of [0,6,1.5,NaN,"5"])await assert.rejects(createReview(buyer,{order:orderId,product,rating}));
 await assert.rejects(createReview(buyer,{order:orderId,product,rating:5,comment:"x".repeat(2001)}));
});
test("verification is admin-only before database operations",async()=>{
 for(const user of [buyer,farmer,null])await assert.rejects(verifyFarmer(user,farmer.id,{verificationStatus:"VERIFIED"}),e=>[401,403].includes(e.status));
});
test("notification read cannot modify another user's notification",async()=>{
 mock.method(Notification,"findById",()=>query({user:other.id}));
 await assert.rejects(readNotifications(buyer,reviewId),e=>e.status===403);
});
test("notification failure is contained and logs no internal exception",async()=>{
 mock.method(Notification,"bulkWrite",async()=>{throw new Error("SECRET");});const log=mock.method(console,"error",()=>{});
 await saveNotifications([{eventKey:"test"}]);assert.equal(log.mock.calls.length,1);assert(!String(log.mock.calls[0].arguments).includes("SECRET"));
});
test("notification list cannot be requested by guest",async()=>{await assert.rejects(getNotifications(null),e=>e.status===401);});
test("geocoding uses India restriction and validates returned coordinates",async()=>{
 let url;const results=await forwardGeocode({addressLine:"Yerwada",district:"Pune",state:"Maharashtra"},{key:"test",fetcher:async value=>{url=value;return Response.json({features:[{place_name:"Pune",center:[73.85,18.52]},{center:[999,18]}]});}});
 assert.equal(new URL(url).searchParams.get("country"),"in");assert.equal(results.length,1);assert.equal(results[0].latitude,18.52);
 assert(!validCoordinates({latitude:null,longitude:null}));assert(!validCoordinates({latitude:"18",longitude:73}));
});
test("geocoding missing key, HTML and network errors remain safe",async()=>{
 await assert.rejects(forwardGeocode({},{}));
 await assert.rejects(forwardGeocode({district:"Pune"},{key:"test",fetcher:async()=>new Response("<html/>")}));
 await assert.rejects(forwardGeocode({district:"Pune"},{key:"test",fetcher:async()=>{throw new Error("offline");}}));
});
test("public product hides exact address and approximates coordinates without mutating storage",()=>{
 const original={location:{addressLine:"Private house",postalCode:"411001",village:"Pune",district:"Pune",state:"Maharashtra",latitude:18.52345,longitude:73.85432}};
 const result=publicProduct(original);assert.equal(result.location.addressLine,undefined);assert.equal(result.location.postalCode,undefined);assert.equal(result.location.latitude,18.52);assert.equal(original.location.addressLine,"Private house");
});
test("client JSON handling rejects HTML without exposing HTML parse errors",async()=>{
 mock.method(globalThis,"fetch",async()=>new Response("<html/>",{status:500}));
 await assert.rejects(apiJSON("/api/test"),e=>e.message==="Service unavailable. Please try again.");
});
