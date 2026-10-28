/* Local preparation only: no photo leaves the device until the user submits. */
window.starislePhoto=async function(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('请选择 JPG、PNG 或 WebP 图片；HEIC 请先转为 JPG');
 if(file.size>20*1024*1024)throw Error('原图过大，请选择 20 MB 以内的照片');
 const url=URL.createObjectURL(file),img=new Image();
 try{
  img.src=url;await img.decode();
  if(!img.naturalWidth||!img.naturalHeight)throw Error('图片读取失败');
  const scale=Math.min(1,2000/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
  let data;
  for(const quality of [.9,.8,.65]){data=canvas.toDataURL('image/jpeg',quality);if(data.split(',')[1].length*3/4<=3*1024*1024)break;}
  if(data.split(',')[1].length*3/4>3*1024*1024)throw Error('压缩后图片仍过大，请分区域拍摄');
  return {data,image:data.split(',')[1],width:canvas.width,height:canvas.height};
 }catch(e){throw Error(e.message||'照片读取失败，请重新选择');}finally{URL.revokeObjectURL(url);}
};
