export function validCoordinates(location) {
 return typeof location?.latitude==="number"&&Number.isFinite(location.latitude)&&Math.abs(location.latitude)<=90&&typeof location?.longitude==="number"&&Number.isFinite(location.longitude)&&Math.abs(location.longitude)<=180;
}
export function locationQuery(location) {
 return ["addressLine","village","district","state","postalCode"].map(k=>location?.[k]?.trim()).filter(Boolean).concat("India").join(", ");
}
export function publicProduct(product) {
 const result=JSON.parse(JSON.stringify(product));
 if(result.location){delete result.location.addressLine;delete result.location.postalCode;
 if(validCoordinates(result.location)){result.location.latitude=Math.round(result.location.latitude*100)/100;result.location.longitude=Math.round(result.location.longitude*100)/100;}
 else {delete result.location.latitude;delete result.location.longitude;}}
 return result;
}
export async function forwardGeocode(location,{key,signal,fetcher=fetch}={}) {
 if(!key)throw new Error("Location search is currently unavailable.");
 const query=locationQuery(location);if(query==="India")return [];
 const url="https://api.maptiler.com/geocoding/"+encodeURIComponent(query)+".json?"+new URLSearchParams({key,country:"in",language:"en",limit:"5",autocomplete:"true"});
 const response=await fetcher(url,{signal});
 if(!response.ok||!response.headers.get("content-type")?.includes("application/json"))throw new Error("Location search is currently unavailable.");
 const data=await response.json();
 return (Array.isArray(data.features)?data.features:[]).flatMap(feature=>{const center=feature.center||feature.geometry?.coordinates;const result={longitude:center?.[0],latitude:center?.[1],label:String(feature.place_name||feature.text||"Farm location").slice(0,300)};return validCoordinates(result)?[result]:[];});
}
