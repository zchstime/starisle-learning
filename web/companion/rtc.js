import VERTC, {RoomProfileType} from '@volcengine/rtc';
export function decode(buffer){const b=new Uint8Array(buffer);if(b.length<8||b.length>65536)throw Error('Invalid RTC frame');const length=new DataView(b.buffer,b.byteOffset,b.byteLength).getUint32(4);if(length!==b.length-8)throw Error('Invalid RTC length');const d=new TextDecoder();return {type:d.decode(b.slice(0,4)),data:JSON.parse(d.decode(b.slice(8)))};}
export function encode(data){const b=new TextEncoder().encode(JSON.stringify(data)),out=new Uint8Array(8+b.length);out.set(new TextEncoder().encode('ctrl'));new DataView(out.buffer).setUint32(4,b.length);out.set(b,8);return out.buffer;}
export function createCall(config,events){
 const engine=VERTC.createEngine(config.appId);let disposed=false;
 engine.on(VERTC.events.onRoomBinaryMessageReceived,e=>{if(disposed)return;try{const {type,data}=decode(e.message);if(type==='subv')for(const item of data.data||[])events.subtitle(item);if(type==='conv')events.stage(Number(data.Stage?.Code));}catch{}});
 engine.on(VERTC.events.onRemoteAudioPropertiesReport,rows=>{if(disposed)return;const row=rows.find(r=>r.streamKey.userId===config.agentId);events.volume(Math.min(1,(row?.audioPropertiesInfo?.linearVolume||0)/100));});
 engine.on(VERTC.events.onError,()=>{if(!disposed)events.error('实时语音连接异常，请重新开始');});
 engine.on(VERTC.events.onAutoplayFailed,()=>{if(!disposed)events.error('浏览器阻止播放，请挂断后重新点击通话');});
 engine.on(VERTC.events.onUserLeave,e=>{if(disposed)return;if(e.userInfo?.userId===config.agentId||e.userId===config.agentId)events.error('星宝已离开通话');});
 return {
 async join(){await engine.startAudioCapture();if(disposed){await engine.stopAudioCapture();return;}await engine.joinRoom(config.token,config.roomId,{userId:config.userId},{isAutoPublish:true,isAutoSubscribeAudio:true,isAutoSubscribeVideo:false,roomProfileType:RoomProfileType.chat});engine.enableAudioPropertiesReport({interval:100});},
 interrupt(){return engine.sendUserBinaryMessage(config.agentId,encode({Command:'interrupt',InterruptMode:1}));},
 async close(){if(disposed)return;disposed=true;try{await engine.stopAudioCapture();}catch{}try{await engine.leaveRoom();}catch{}VERTC.destroyEngine(engine);}
 };
}
window.StarisleRTC={createCall};
