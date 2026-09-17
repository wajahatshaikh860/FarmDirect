import {z} from "zod";
import {objectId} from "./cartValidator.js";
export const reviewChanges = z.object({rating:z.number().int().min(1).max(5),comment:z.string().trim().max(2000).default("")}).strict();
export const reviewCreate = reviewChanges.extend({order:objectId,product:objectId});
