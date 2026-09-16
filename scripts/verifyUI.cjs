const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const fs = require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL || 'chrome'});
 const page=await browser.newPage();
 page.setDefaultTimeout(60000);
 const base=process.env.TEST_BASE_URL || 'http://localhost:3000';
 const checks=[];
 fs.mkdirSync('.verification',{recursive:true});
 for(const width of [375,768,1440]) {
  await page.setViewportSize({width,height:900});
  for(const route of ['/','/login','/register','/register?role=FARMER','/marketplace']) {
   const response=await page.goto(base+route,{waitUntil:'networkidle'});
   if(response.status()!==200) throw new Error(`${route}: HTTP ${response.status()}`);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
   if(overflow) throw new Error(`Horizontal overflow at ${width}px on ${route}`);
   if(route.includes('FARMER')) await page.getByLabel('Farm name',{exact:true}).waitFor();
   checks.push(`${width}px ${route}: OK`);
   if(width===375 || width===1440) await page.screenshot({path:`.verification/${width}-${route==='/'?'home':route.replace(/[^a-z]/gi,'')}.png`,fullPage:true});
  }
 }
 await page.setViewportSize({width:375,height:900});
 await page.goto(base+'/');
 await page.getByRole('button',{name:'Toggle navigation'}).click();
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Sign Up'}).click();
 await page.waitForURL('**/register');
 checks.push('Mobile navigation: OK');
 for(const role of ['farmer','buyer','admin']) {
  await page.goto(base+`/${role}/dashboard`,{waitUntil:'networkidle'});
  if(!page.url().includes('/login')) throw new Error(`Unauthenticated ${role} access not blocked`);
  checks.push(`Unauthenticated ${role} dashboard blocked: OK`);
 }
 const invalid=await page.request.post(base+'/api/register',{headers:{origin:base},data:{role:'ADMIN'}});
 if(invalid.status()!==400) throw new Error(`Public admin signup returned ${invalid.status()}`);
 const foreign=await page.request.post(base+'/api/register',{headers:{origin:'https://other.example'},data:{}});
 if(foreign.status()!==403) throw new Error('Cross-origin signup not rejected');
 const malformed=await page.request.post(base+'/api/register',{headers:{origin:base},data:{name:'x',email:'bad',phone:'123',password:'x',confirmPassword:'y',role:'BUYER'}});
 if(malformed.status()!==400) throw new Error('Invalid signup fields not rejected');
 checks.push('API public ADMIN rejection, invalid fields, and origin protection: OK');
 fs.writeFileSync('.verification/ui-results.json',JSON.stringify(checks,null,2));
 console.log(checks.join('\n'));
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
