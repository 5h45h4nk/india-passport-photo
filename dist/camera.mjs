// Camera access is requested only by an explicit user action. No audio is requested.
export class CameraController {
  constructor({video,mediaDevices=globalThis.navigator?.mediaDevices,onEnded=()=>{}}){this.video=video;this.mediaDevices=mediaDevices;this.onEnded=onEnded;this.stream=null;this.generation=0;}
  get supported(){return !!this.mediaDevices?.getUserMedia;}
  async devices(){if(!this.mediaDevices?.enumerateDevices)return [];return (await this.mediaDevices.enumerateDevices()).filter(device=>device.kind==='videoinput');}
  release(){if(this.stream){for(const track of this.stream.getTracks())track.stop();this.stream=null;}this.video.pause();this.video.srcObject=null;}
  stop(){this.generation++;this.release();}
  async open(deviceId){
    if(!this.supported)throw Object.assign(new Error('Camera API unavailable'),{name:'NotSupportedError'});
    const generation=++this.generation;this.release();let stream;
    try{
      const video={width:{ideal:1920},height:{ideal:1080},...(deviceId?{deviceId:{exact:deviceId}}:{facingMode:{ideal:'user'}})};
      stream=await this.mediaDevices.getUserMedia({audio:false,video});
      if(generation!==this.generation){stream.getTracks().forEach(track=>track.stop());return null;}
      this.stream=stream;this.video.srcObject=stream;
      await this.video.play();
      if(generation!==this.generation){stream.getTracks().forEach(track=>track.stop());return null;}
      if(!this.video.videoWidth||!this.video.videoHeight){await new Promise((resolve,reject)=>{const done=()=>{cleanup();resolve();};const fail=()=>{cleanup();reject(new Error('Camera has no usable frames'));};const timer=setTimeout(fail,15000);const cleanup=()=>{clearTimeout(timer);this.video.removeEventListener('loadeddata',done);this.video.removeEventListener('error',fail);};this.video.addEventListener('loadeddata',done,{once:true});this.video.addEventListener('error',fail,{once:true});});}
      if(generation!==this.generation)return null;
      if(!this.video.videoWidth||!this.video.videoHeight)throw new Error('Camera has no usable frames');
      const track=stream.getVideoTracks()[0];
      track.addEventListener('ended',()=>{if(this.stream!==stream)return;this.stop();this.onEnded();},{once:true});
      return {width:this.video.videoWidth,height:this.video.videoHeight,deviceId:track.getSettings?.().deviceId||deviceId||''};
    }catch(error){stream?.getTracks().forEach(track=>track.stop());if(generation!==this.generation)return null;this.release();throw error;}
  }
}
export function cameraError(error){switch(error?.name){case 'NotAllowedError':case 'SecurityError':return 'Camera permission was denied. Allow camera access in your browser’s site settings, then try again.';case 'NotFoundError':return 'No camera was found. Connect a webcam or enable Continuity Camera on your iPhone, then try again.';case 'NotReadableError':case 'AbortError':return 'The camera could not start. Close other apps using it, check its connection, and try again.';case 'OverconstrainedError':return 'That camera is no longer available. Refresh the camera list and choose another.';case 'NotSupportedError':return 'Camera access is unavailable here. Open this HTTPS page in Safari, Chrome, or Edge, or upload a photo.';default:return 'Could not start the camera. Check your browser’s camera permission and try again.';}}
