const projectsEl = document.getElementById('projects');
const countEl = document.getElementById('count');
const searchEl = document.getElementById('search');
document.getElementById('year').textContent = new Date().getFullYear();

let data = [];
let q = "";

function generatedThumb(seed){
  const hue = [...seed].reduce((a,c)=>(a+c.charCodeAt(0))%360,120);
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='hsl(${hue},70%,55%)'/>
      <stop offset='100%' stop-color='hsl(${(hue+70)%360},70%,55%)'/></linearGradient></defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' fill='rgba(0,0,0,.3)'
        font-family='Inter,Arial' font-size='86' font-weight='800'>${seed.replace(/</g,'&lt;')}</text>
    </svg>` )}`;
}

function render(list){
  countEl.textContent = list.length;
  projectsEl.innerHTML = list.map(p => {
    const href = `projects/${encodeURIComponent(p.slug)}/`; // build-time subpages
    const img = p.image || generatedThumb(p.title);
    return `
      <a class="card" href="${href}">
        <img class="thumb" alt="${p.title} preview" src="${img}">
        <div class="content">
          <h3 class="title">${p.title}</h3>
          <p class="desc">${p.description ?? ""}</p>
        </div>
      </a>`;
  }).join('');
}

function filter(){
  const needle = q.trim().toLowerCase();
  if(!needle) return data;
  return data.filter(p => {
    const hay = [p.title, p.description, ...(p.tags||[]), ...(p.tech||[])]
      .join(' ').toLowerCase();
    return hay.includes(needle);
  });
}

searchEl.addEventListener('input', (e)=>{ q = e.target.value; render(filter()); });

fetch('projects.json')
  .then(r => r.json())
  .then(list => {
    data = [...list].sort((a,b)=>(b.date||'').localeCompare(a.date||'') || a.title.localeCompare(b.title));
    render(data);
  })
  .catch(err => {
    console.error(err);
    projectsEl.innerHTML = "<p>Couldn’t load projects.</p>";
  });
