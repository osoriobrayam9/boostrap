const URL = 'https://todoapitest.juansegaliz.com/todos';

const net = async (p='', init={}) => {
  const res = await fetch(URL+p, { headers:{'Content-Type':'application/json'}, ...init });
  const t = await res.text(); const d = t?(()=>{try{return JSON.parse(t)}catch{return t}})():null;
  if(!res.ok) throw new Error((d && d.message) || res.statusText);
  return d;
};

const ui = {
  form: document.querySelector('#bs-form'),
  title: document.querySelector('#bs-title'),
  desc: document.querySelector('#bs-desc'),
  reload: document.querySelector('#bs-reload'),
  list: document.querySelector('#bs-list'),
  tpl: document.querySelector('#bs-item'),
};

const data = { list: [] };

function draw(){
  ui.list.innerHTML = '';
  for(const it of data.list){
    const li = ui.tpl.content.firstElementChild.cloneNode(true);
    li.dataset.id = it.id;
    li.querySelector('.bs-title').textContent = it.title ?? '(Sin título)';
    const dd = li.querySelector('.bs-desc'); dd.textContent = it.description ?? '';
    dd.classList.toggle('d-none', !dd.textContent);
    const cb = li.querySelector('.bs-toggle'); cb.checked = !!it.completed;
    if(it.completed) li.querySelector('.bs-title').classList.add('text-decoration-line-through','text-secondary');
    ui.list.appendChild(li);
  }
}

async function sync(){
  const r = await net('');
  data.list = Array.isArray(r) ? r : (r?.items ?? []);
  draw();
}

async function add(e){
  e.preventDefault();
  const payload = { title: ui.title.value.trim(), description: ui.desc.value.trim() || null, completed: false };
  if(!payload.title) return;
  const created = await net('', { method:'POST', body: JSON.stringify(payload) });
  data.list.unshift(created);
  ui.form.reset(); draw();
}

async function done(id, val){
  const i = data.list.findIndex(x=>String(x.id)===String(id)); if(i<0) return;
  const prev = data.list[i]; data.list[i] = { ...prev, completed: val }; draw();
  try{ const saved = await net('/'+encodeURIComponent(id), { method:'PUT', body: JSON.stringify({ completed: val }) }); data.list[i] = { ...data.list[i], ...saved }; }
  catch{ data.list[i] = prev; draw(); }
}

async function drop(id){
  const i = data.list.findIndex(x=>String(x.id)===String(id)); if(i<0) return;
  const tmp = data.list.splice(i,1)[0]; draw();
  try{ await net('/'+encodeURIComponent(id), { method:'DELETE' }); }
  catch{ data.list.splice(i,0,tmp); draw(); }
}

function edit(id){
  const li = ui.list.querySelector(`li[data-id="${CSS.escape(String(id))}"]`);
  if(!li) return;
  const row = data.list.find(x=>String(x.id)===String(id));
  const t = document.createElement('input'); t.className='form-control form-control-sm bg-dark text-light'; t.value = row.title ?? '';
  const d = document.createElement('input'); d.className='form-control form-control-sm bg-dark text-light'; d.placeholder='Descripción'; d.value = row.description ?? '';
  li.querySelector('.bs-title').replaceWith(t);
  li.querySelector('.bs-desc').replaceWith(d);
  const ok = document.createElement('button'); ok.className='btn btn-outline-light btn-sm'; ok.textContent='Guardar'; ok.dataset.bsAct='save';
  li.querySelector('.bs-edit').replaceWith(ok);
  t.focus();
}

async function save(id, li){
  const [t, d] = li.querySelectorAll('input');
  const payload = { title: t?.value.trim() || '(Sin título)', description: d?.value.trim() || null };
  const i = data.list.findIndex(x=>String(x.id)===String(id)); if(i<0) return;
  const prev = data.list[i]; data.list[i] = { ...prev, ...payload }; draw();
  try{ const saved = await net('/'+encodeURIComponent(id), { method:'PUT', body: JSON.stringify(payload) }); data.list[i] = { ...data.list[i], ...saved }; }
  catch{ data.list[i] = prev; draw(); }
}

ui.list.addEventListener('click', (e)=>{
  const li = e.target.closest('li'); if(!li) return;
  const id = li.dataset.id;
  if(e.target.matches('.bs-toggle')) return void done(id, e.target.checked);
  if(e.target.matches('.bs-del')) return void drop(id);
  if(e.target.matches('[data-bs-act="save"]')) return void save(id, li);
  if(e.target.matches('.bs-edit')) return void edit(id);
});

ui.form.addEventListener('submit', add);
ui.reload.addEventListener('click', sync);
sync();