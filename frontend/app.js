const inputEl = document.getElementById('input');
const outEl = document.getElementById('output');
const convertBtn = document.getElementById('convert');
const clearBtn = document.getElementById('clear');

convertBtn.addEventListener('click', async ()=>{
  const val = inputEl.value.trim();
  if (!val) return;
  outEl.textContent = 'Converting...';
  let body;
  if (val.startsWith('http')) body = { url: val };
  else body = { raw: val };
  try {
    const res = await fetch('http://localhost:3000/api/convert', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) {
      outEl.textContent = `Error: ${JSON.stringify(json)}`;
      return;
    }
    if (json.errors && json.errors.length) {
      outEl.textContent = 'Some sets had errors:\n' + JSON.stringify(json.errors, null, 2) + '\n\n';
    }
    const texts = json.converted.map(c=>c.convertedText).join('\n\n');
    outEl.textContent += texts || 'No convertible sets found.';
  } catch (err) {
    outEl.textContent = 'Request failed: ' + err.message;
  }
});

clearBtn.addEventListener('click', ()=>{ inputEl.value = ''; outEl.textContent = ''; });
