let timer;
export function toast(message) {
 const el = document.querySelector('#toast');
 el.textContent = message; el.classList.add('visible');
 clearTimeout(timer); timer = setTimeout(() => el.classList.remove('visible'), 4200);
}
