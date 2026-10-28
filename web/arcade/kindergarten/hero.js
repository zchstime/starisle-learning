import * as THREE from 'three';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
export async function createHero(canvas,isSpeaking,isPaused,modelUrl=new URL('./assets/xingbao.glb',import.meta.url).href){
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-2,2,2,-2,.01,100);camera.position.set(0,0,8);camera.lookAt(0,0,0);
 const gltf=await new GLTFLoader().loadAsync(modelUrl),root=gltf.scene;
 // The main game uses the baked portrait palette: avoid lighting it a second time.
 root.traverse(o=>{if(!o.isMesh)return;const convert=m=>new THREE.MeshBasicMaterial({map:m.map,color:m.color,vertexColors:!!o.geometry.attributes.color,transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest,side:m.side});o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);});
 const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());root.position.sub(center);const holder=new THREE.Group();holder.add(root);holder.scale.setScalar(3/Math.max(size.x,size.y));holder.rotation.y=-.06;scene.add(holder);
 const mixer=new THREE.AnimationMixer(root),idle=gltf.animations.find(a=>/idle/i.test(a.name)),wave=gltf.animations.find(a=>/wave/i.test(a.name));if(idle)mixer.clipAction(idle).play();let lastTalk=false;const waveAction=wave?mixer.clipAction(wave):null;
 const resize=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const height=Math.max(3.6,3.2/(w/h));camera.left=-height*w/h/2;camera.right=height*w/h/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(canvas);resize();let previous=0,clock=0,alive=true;
 function tick(t){if(!alive)return;requestAnimationFrame(tick);const dt=previous?Math.min((t-previous)/1000,.05):.016;previous=t;if(!isPaused()&&!document.hidden){clock+=dt;mixer.update(dt);holder.position.y=Math.sin(clock*1.8)*.025;const talk=isSpeaking();if(talk&&!lastTalk&&waveAction){waveAction.reset().setLoop(THREE.LoopOnce,1).play();}lastTalk=talk;}renderer.render(scene,camera);}requestAnimationFrame(tick);
 window.addEventListener('pagehide',()=>{alive=false;ro.disconnect();renderer.dispose();},{once:true});return {loaded:true,animations:gltf.animations.map(a=>a.name)};
}
