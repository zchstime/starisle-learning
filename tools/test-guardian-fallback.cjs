const fs=require('fs'),assert=require('assert/strict'),ts=require('/Applications/CocosCreator-3.8.8.app/Contents/Resources/app.asar.unpacked/node_modules/typescript');
for(const fail of [true,false]){
 const nodes=[];let sprites=0;const output={};
 const deps={'./Guardian3D':{Guardian3D:{ready:true}},cc:{Node:{EventType:{TOUCH_END:'touch'}}},'../ui/Kit':{node(){const n={active:true,destroy(){this.destroyed=true;},addComponent(){return {setup(){if(fail)throw Error('simulated renderer failure');}};},on(){}};nodes.push(n);return n;},sprite(){sprites++;}}};
 new Function('exports','require','console',ts.transpileModule(fs.readFileSync('assets/scripts/adventure/WorldMotion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(output,id=>deps[id],{warn(){}});
 output.guardian({}, {},0,0,100,()=>{});
 assert.equal(sprites,fail?1:0);assert.equal(nodes.length,fail?2:1);if(fail){assert.equal(nodes[0].active,false);assert.equal(nodes[0].destroyed,true);}
}
console.log('PASS renderer failure falls back safely; successful 3D path preserved');
