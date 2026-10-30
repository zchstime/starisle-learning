class StarislePCM extends AudioWorkletProcessor {
 constructor(){super();this.batch=new Float32Array(4096);this.offset=0;this.port.onmessage=e=>{if(e.data==='flush'){if(this.offset)this.port.postMessage(this.batch.slice(0,this.offset));this.offset=0;this.port.postMessage('flushed');}};}
 process(inputs){const channel=inputs[0]?.[0];if(channel){for(const v of channel){this.batch[this.offset++]=v;if(this.offset===this.batch.length){this.port.postMessage(this.batch);this.batch=new Float32Array(4096);this.offset=0;}}}return true;}
}
registerProcessor('starisle-pcm',StarislePCM);
