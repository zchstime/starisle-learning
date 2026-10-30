const path=require('node:path');
require('esbuild').buildSync({entryPoints:[path.join(__dirname,'../web/companion/rtc.js')],outfile:path.join(__dirname,'../web/companion/rtc.bundle.js'),bundle:true,minify:true,format:'iife',target:['es2020'],legalComments:'eof'});
console.log('Built local RTC companion bundle');
