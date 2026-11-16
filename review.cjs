const {chromium}=require(process.env.TEMP+'/west-map-check/node_modules/playwright-core');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1360,height:860}}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
 page.on('console',e=>{if(e.type()==='error'){errors.push(e.text());console.error(e.text())}});
 await page.goto('http://127.0.0.1:18780/');
 await page.waitForSelector('[data-ready]',{state:'attached',timeout:90000});
 await page.waitForFunction(()=>document.querySelector('#model').dataset.pose,{timeout:90000});
 console.log(await page.locator('body').getAttribute('data-model'));
 for(const mode of ['overview','street','rail','air','top']){
  await page.locator('[data-view="'+mode+'"]').click();
  await page.waitForFunction(m=>JSON.parse(document.querySelector('#model').dataset.pose).mode===m,mode,{timeout:90000});
  await page.screenshot({path:'review-'+mode+'.jpg',quality:92});
 }
 await page.locator('[data-view="street"]').click();
 await page.waitForFunction(()=>JSON.parse(document.querySelector('#model').dataset.pose).mode==='street');
 const start=await page.evaluate(()=>JSON.parse(document.querySelector('#model').dataset.pose).position);
 await page.keyboard.down('w');await page.keyboard.down('Shift');
 try{await page.waitForFunction(s=>{const p=JSON.parse(document.querySelector('#model').dataset.pose).position;return Math.hypot(p[0]-s[0],p[2]-s[2])>5},start,{timeout:90000,polling:250})}
 finally{await page.keyboard.up('w');await page.keyboard.up('Shift')}
 console.log('walking',start,await page.locator('#model').getAttribute('data-pose'));
 await page.keyboard.press('f');
 await page.waitForFunction(()=>JSON.parse(document.querySelector('#model').dataset.pose).flying);
 await page.setViewportSize({width:430,height:780});
 await page.locator('[data-view="overview"]').click();
 await page.waitForFunction(()=>JSON.parse(document.querySelector('#model').dataset.pose).mode==='overview');
 await page.screenshot({path:'review-mobile.jpg',quality:90});
 if(errors.length)throw Error(errors.join('\n'));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1;});
