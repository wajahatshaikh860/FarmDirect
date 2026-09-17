export async function apiJSON(url,options={}) {
 const response=await fetch(url,options);
 if(!response.headers.get("content-type")?.includes("application/json"))throw new Error("Service unavailable. Please try again.");
 const data=await response.json();
 if(!response.ok)throw new Error(data.message||"Request could not be completed.");
 return data;
}
