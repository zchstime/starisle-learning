const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const profile=require('../web/auth/profile.js'),validate=require('../server/saves.cjs').validate;
const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},a={id:'a'},b={id:'b'};
assert.equal(profile.read(storage,a).avatar,'xingbao');
const progressKey='starisle.account.a.starisle.adventure.v3';storage.setItem(progressKey,'existing-progress');
profile.choose(storage,a,'fox',100);assert.equal(profile.read(storage,a).avatar,'fox');assert.equal(profile.read(storage,b).avatar,'xingbao');assert.equal(storage.getItem(progressKey),'existing-progress');
profile.choose(storage,b,'rabbit',110);assert.equal(profile.read(storage,a).avatar,'fox');assert.equal(profile.read(storage,b).avatar,'rabbit');
assert.throws(()=>profile.choose(storage,null,'fox'));assert.throws(()=>profile.choose(storage,a,'https://example.com/avatar'));
for(const avatar of profile.AVATARS)assert.doesNotThrow(()=>validate({[profile.KEY]:JSON.stringify({version:1,avatar:avatar.id,updatedAt:100})}));
for(const invalid of [{version:2,avatar:'fox',updatedAt:1},{version:1,avatar:'unknown',updatedAt:1},{version:1,avatar:'fox',updatedAt:-1},{version:1,avatar:'fox',updatedAt:1,points:999}])assert.throws(()=>validate({[profile.KEY]:JSON.stringify(invalid)}));
const win={addEventListener(){},dispatchEvent(){}};vm.runInNewContext(fs.readFileSync('web/auth/cloud.js','utf8'),{window:win,setInterval(){},setTimeout(){},clearTimeout(){}});
const old={[profile.KEY]:JSON.stringify({version:1,avatar:'fox',updatedAt:100})},recent={[profile.KEY]:JSON.stringify({version:1,avatar:'cat',updatedAt:200})};
assert.equal(JSON.parse(win.starisleCloud.merge(recent,old)[profile.KEY]).avatar,'cat');assert.equal(JSON.parse(win.starisleCloud.merge(old,recent)[profile.KEY]).avatar,'cat');assert.equal(win.starisleCloud.merge(old,{})[profile.KEY],old[profile.KEY]);
// A corrupt local profile falls back safely; legacy progress needs no migration.
storage.setItem('starisle.account.a.'+profile.KEY,'not json');assert.equal(profile.read(storage,a).avatar,'xingbao');assert.doesNotThrow(()=>validate({'starisle.adventure.v3':JSON.stringify({version:3,done:[],medals:[]})}));
console.log('PASS profile: six avatars, account isolation, persistence, progress preservation, validation, cloud conflict ordering, old saves');
