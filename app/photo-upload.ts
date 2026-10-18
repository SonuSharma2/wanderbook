const photoTypes=['image/jpeg','image/png','image/webp','image/avif'];
export const PHOTO_UPLOAD_ACCEPT='image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,image/heic-sequence,image/heif-sequence,.heic,.heif';

export function isHeicPhoto(file:Pick<File,'type'|'name'>){
 return /^image\/hei[cf](?:-sequence)?$/i.test(file.type)||/\.hei[cf]$/i.test(file.name);
}

export async function preparePhoto(file:File,onConverting?:()=>void):Promise<File>{
 const heic=isHeicPhoto(file);
 if(!heic&&!photoTypes.includes(file.type))throw Error('Choose JPG, PNG, WebP, AVIF, HEIC or HEIF photos.');
 if(!file.size)throw Error(`“${file.name}” is empty. Choose another photo.`);
 if(file.size>25*1024*1024)throw Error('Choose photos smaller than 25 MB before compression.');
 let bitmap:ImageBitmap|undefined;
 let canvas:HTMLCanvasElement|undefined;
 try{
  try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'})}
  catch(error){
   if(!heic)throw error;
   onConverting?.();
   // Load the local decoder only on browsers that cannot decode HEIC natively.
   // heic-to performs decoding in a worker; photos never visit a converter service.
   const {heicTo}=await import('heic-to/csp');
   bitmap=await heicTo({blob:file,type:'bitmap'});
  }
  if(!bitmap.width||!bitmap.height)throw Error('Empty image');
  const ratio=Math.min(1,2200/Math.max(bitmap.width,bitmap.height));
  canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
  const context=canvas.getContext('2d');if(!context)throw Error('Canvas unavailable');
  context.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas!.toBlob(value=>value?resolve(value):reject(Error('Image encoding failed')),'image/jpeg',.88));
  if(blob.size>8*1024*1024)throw Error('That photo is too large. Try a smaller image.');
  return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'});
 }catch(error){
  if(error instanceof Error&&error.message==='That photo is too large. Try a smaller image.')throw error;
  throw Error(`Could not ${heic?'convert this HEIC/HEIF photo':'read this photo'}: “${file.name}”. Try exporting it as JPG and selecting it again.`);
 }finally{
  bitmap?.close();if(canvas){canvas.width=1;canvas.height=1}
 }
}
