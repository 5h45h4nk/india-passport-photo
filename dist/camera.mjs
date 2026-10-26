// Camera access is requested only by an explicit user action. No audio is requested.
export class CameraController {
  constructor({video,mediaDevices=globalThis.navigator?.mediaDevices,onEnded=()=>{}}){this.video=video;this.mediaDevices=mediaDevices;this.onEnded=onEnded;this.stream=null;this.generation=0;}
  get supported(){return !!this.mediaDevices?.getUserMedia;}
  async devices(){if(!this.mediaDevices?.enumerateDevices)return [];return (await this.mediaDevices.enumerateDevices()).filter(device=>device.kind==='videoinput');}
  zoomRange(){try{const track=this.stream?.getVideoTracks()[0],z=track?.getCapabilities?.().zoom;if(!track?.applyConstraints||!z||!Number.isFinite(z.min)||!Number.isFinite(z.max)||z.max<=z.min)return null;const step=Number.isFinite(z.step)&&z.step>0?z.step:.1;const current=track.getSettings?.().zoom;return {min:z.min,max:z.max,step,value:Number.isFinite(current)?current:Math.max(z.min,Math.min(z.max,1))};}catch{return null;}}
  async setZoom(value){const stream=this.stream,track=stream?.getVideoTracks()[0],range=this.zoomRange();if(!range)throw new Error('Camera zoom is not exposed by this browser');const number=Number(value);if(!Number.isFinite(number))throw new Error('Invalid camera zoom');const target=Math.max(range.min,Math.min(range.max,range.min+Math.round((number-range.min)/range.step)*range.step));const constraints=track.getConstraints?.()||{};const advanced=(constraints.advanced||[]).map(item=>{const copy={...item};delete copy.zoom;return copy;}).filter(item=>Object.keys(item).length);await track.applyConstraints({...constraints,advanced:[...advanced,{zoom:target}]});if(this.stream!==stream)return null;const actual=track.getSettings?.().zoom;if(!Number.isFinite(actual))throw new Error('The browser did not report the applied camera zoom');return actual;}
  release(){if(this.stream){for(const track of this.stream.getTracks())track.stop();this.stream=null;}this.video.pause();this.video.srcObject=null;}
  stop(){this.generation++;this.release();}
  async open(deviceId,{facingMode}={}){
    if(!this.supported)throw Object.assign(new Error('Camera API unavailable'),{name:'NotSupportedError'});
    const generation=++this.generation;this.release();let stream;
    try{
      const video={width:{ideal:8192},height:{ideal:8192},frameRate:{ideal:15},resizeMode:{ideal:'none'},...(facingMode?{facingMode:{exact:facingMode}}:deviceId?{deviceId:{exact:deviceId}}:{facingMode:{ideal:'user'}})};
      stream=await this.mediaDevices.getUserMedia({audio:false,video});
      if(generation!==this.generation){stream.getTracks().forEach(track=>track.stop());return null;}
      this.stream=stream;
      const track=stream.getVideoTracks()[0];
      // Ask the selected track for its reported maximums. Ideal constraints allow
      // the browser to choose a supported width/height combination without failing.
      if(track.getCapabilities&&track.applyConstraints){
        try{const caps=track.getCapabilities(),width=caps.width?.max,height=caps.height?.max;
          if(Number.isFinite(width)&&width>0&&Number.isFinite(height)&&height>0){
            const maximum={...video,width:{ideal:width},height:{ideal:height}};
            try{await track.applyConstraints(maximum);}catch{if(generation!==this.generation){stream.getTracks().forEach(t=>t.stop());return null;}const compatible={...maximum};delete compatible.resizeMode;delete compatible.frameRate;try{await track.applyConstraints(compatible);}catch{/* Keep the already working stream if maximum negotiation is rejected. */}}
          }
        }catch{/* Capability APIs are optional; the initial request already prefers high resolution. */}
      }
      if(generation!==this.generation){stream.getTracks().forEach(t=>t.stop());return null;}
      this.video.srcObject=stream;
      await this.video.play();
      if(generation!==this.generation){stream.getTracks().forEach(track=>track.stop());return null;}
      if(!this.video.videoWidth||!this.video.videoHeight){await new Promise((resolve,reject)=>{const done=()=>{cleanup();resolve();};const fail=()=>{cleanup();reject(new Error('Camera has no usable frames'));};const timer=setTimeout(fail,15000);const cleanup=()=>{clearTimeout(timer);this.video.removeEventListener('loadeddata',done);this.video.removeEventListener('error',fail);};this.video.addEventListener('loadeddata',done,{once:true});this.video.addEventListener('error',fail,{once:true});});}
      if(generation!==this.generation)return null;
      if(!this.video.videoWidth||!this.video.videoHeight)throw new Error('Camera has no usable frames');
      track.addEventListener('ended',()=>{if(this.stream!==stream)return;this.stop();this.onEnded();},{once:true});
      return {width:this.video.videoWidth,height:this.video.videoHeight,deviceId:track.getSettings?.().deviceId||deviceId||'',facingMode:track.getSettings?.().facingMode||facingMode||''};
    }catch(error){stream?.getTracks().forEach(track=>track.stop());if(generation!==this.generation)return null;this.release();throw error;}
  }
}
export function cameraError(error){switch(error?.name){case 'NotAllowedError':case 'SecurityError':return 'Camera permission was denied. Allow camera access in your browser’s site settings, then try again.';case 'NotFoundError':return 'No camera was found. Connect a webcam or enable Continuity Camera on your iPhone, then try again.';case 'NotReadableError':case 'AbortError':return 'The camera could not start. Close other apps using it, check its connection, and try again.';case 'OverconstrainedError':return 'The requested camera is unavailable. Try Front camera or choose another camera from the list. On iPhone, open this page directly in Safari and allow camera access.';case 'NotSupportedError':return 'Camera access is unavailable here. Open this HTTPS page in Safari, Chrome, or Edge, or upload a photo.';default:return 'Could not start the camera. Check your browser’s camera permission and try again.';}}
