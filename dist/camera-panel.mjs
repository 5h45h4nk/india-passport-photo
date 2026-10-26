// Move the existing preview and checks into the dialog; do not duplicate streams,
// canvases, controls, or model workers. Anchors restore the editor on close.
export function createCameraPanel({dialog,entries,onExit}){
 const anchors=entries.map(([node,slot])=>{const anchor=document.createComment('camera-panel-home');node.before(anchor);return {node,slot,anchor};});
 let active=false;
 function setOpen(open){if(open===active)return;active=open;if(open){for(const {node,slot} of anchors)slot.append(node);dialog.showModal();}else{for(const {node,anchor} of anchors)anchor.after(node);if(dialog.open)dialog.close();}}
 dialog.addEventListener('cancel',event=>{event.preventDefault();onExit();});
 dialog.addEventListener('close',()=>{if(active)onExit();});
 return {setOpen};
}
