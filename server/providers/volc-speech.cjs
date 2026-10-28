const {randomUUID}=require('node:crypto');
// Official TTS 2 HTTP chunk protocol. Credentials never enter client assets.
module.exports=({apiKey,speaker='ICL_uranus_zh_female_keainvsheng_tob'},fetcher=fetch)=>async text=>{
 if(!apiKey||typeof text!=='string'||!text.length||text.length>250)throw Error('Invalid speech configuration or text');
 const response=await fetcher('https://openspeech.bytedance.com/api/v3/tts/unidirectional',{
  method:'POST',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json','X-Api-Key':apiKey,'X-Api-Resource-Id':'seed-tts-2.0','X-Api-Request-Id':randomUUID()},
  body:JSON.stringify({req_params:{text,speaker,audio_params:{format:'mp3',sample_rate:24000,speech_rate:-5},additions:JSON.stringify({context_texts:['用软萌、清亮的卡通小精灵语气说话，亲切有活力，吐字清晰，温柔鼓励，不要尖叫，不要夸张拖长尾音。']})}})
 });
 if(!response.ok)throw Error('Speech HTTP '+response.status);
 let pending='',size=0;const chunks=[];const decoder=new TextDecoder();
 const accept=line=>{if(!line.trim())return;const data=JSON.parse(line);if(data.code!==0&&data.code!==20000000)throw Error('Speech provider code '+data.code);if(data.data)chunks.push(Buffer.from(data.data,'base64'));};
 for await(const chunk of response.body){size+=chunk.length;if(size>8*1024*1024)throw Error('Speech response too large');pending+=decoder.decode(chunk,{stream:true});let at;while((at=pending.indexOf('\n'))>=0){accept(pending.slice(0,at));pending=pending.slice(at+1);}}
 pending+=decoder.decode();accept(pending);const audio=Buffer.concat(chunks);if(audio.length<1000)throw Error('Empty speech response');return audio;
};
