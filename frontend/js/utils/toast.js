let timer;
export function toast(message,{actionLabel,onAction}={}) {
  const element=document.querySelector('#toast');
  element.replaceChildren(document.createTextNode(message));
  if(actionLabel&&onAction){const action=document.createElement('button');action.type='button';action.textContent=actionLabel;action.className='toast-action';action.onclick=()=>{element.classList.remove('visible');element.inert=true;clearTimeout(timer);onAction();};element.append(action);}
  element.inert=false;element.classList.add('visible');clearTimeout(timer);
  timer=setTimeout(()=>{element.classList.remove('visible');element.inert=true;},onAction?10000:4200);
}
