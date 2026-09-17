import {productReviews,orderReviews,ratingSummary} from "@/services/reviewService";
import StarRating from "./StarRating";
import ReviewEditor from "./ReviewEditor";
import "./phase4.css";
export async function ProductReviews({product,user}) {
 const {average,count,reviews}=await productReviews(product._id);
 return <section className="phase4-card"><h2>Reviews & Ratings</h2><div className="phase4-row"><StarRating value={average}/><strong>{average.toFixed(1)}</strong><span>{count} review{count===1?"":"s"}</span></div>{!count&&<p className="muted">No reviews yet. Buyers can review products after delivery.</p>}{reviews.map(review=>user?.role==="BUYER"&&user.id===review.buyer?._id?<ReviewEditor key={review._id} review={review}/>:<article className="phase4-review" key={review._id}><strong>{review.buyer?.name||"Buyer"}</strong><div className="phase4-row"><StarRating value={review.rating}/><small>{new Date(review.createdAt).toLocaleDateString("en-IN",{timeZone:"UTC"})}</small></div><blockquote>{review.comment}</blockquote></article>)}{count>50&&<p>Showing the 50 most recent reviews.</p>}</section>;
}
export async function OrderReviews({order,user}) {
 if(order.orderStatus!=="DELIVERED")return null;
 const reviews=await orderReviews(user,order);
 return <section className="phase4-card"><h2>Review your delivered products</h2>{order.items.map(item=><ReviewEditor key={item.product+":"+(reviews.find(r=>r.product===item.product)?._id||"new")} order={order._id} product={item.product} productName={item.productName} review={reviews.find(r=>r.product===item.product)}/>)}</section>;
}
export async function FarmerRating({id}){const rating=await ratingSummary("farmer",id);return <p className="phase4-row"><StarRating value={rating.average}/><span>{rating.average.toFixed(1)} · {rating.count} farmer review{rating.count===1?"":"s"}</span></p>;}
