const inputEl = document.getElementById('input');
const outEl = document.getElementById('output');
const convertBtn = document.getElementById('convert');
const clearBtn = document.getElementById('clear');

convertBtn.addEventListener('click', async ()=>{
  const val = inputEl.value.trim();
  if (!val) return;
  // Clear previous output (no literal "Converting..." text)
  outEl.textContent = '';
  let body;
  if (val.startsWith('http')) body = { url: val };
  else body = { raw: val };
  try {
    const res = await fetch('/api/convert', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) {
      outEl.textContent = `Error: ${JSON.stringify(json)}`;
      return;
    }
    let outputText = '';
    if (json.errors && json.errors.length) {
      outputText += 'Some sets had errors:\n' + JSON.stringify(json.errors, null, 2) + '\n\n';
    }
    const texts = json.converted.map(c=>c.convertedText).join('\n\n');
    outputText += texts || 'No convertible sets found.';
    outEl.textContent = outputText;
  } catch (err) {
    outEl.textContent = 'Request failed: ' + err.message;
  }
});

// Copy All button
const copyBtn = document.getElementById('copyAll');
if (copyBtn) {
  copyBtn.addEventListener('click', async () => {
    const text = outEl.textContent || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      const old = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(()=> { copyBtn.textContent = old; }, 1500);
    } catch (e) {
      // fallback: select the pre text and execCommand
      try {
        const range = document.createRange();
        range.selectNodeContents(outEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('copy');
        sel.removeAllRanges();
        const old = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(()=> { copyBtn.textContent = old; }, 1500);
      } catch (err) {
        console.error('Copy failed', err);
      }
    }
  });
}

clearBtn.addEventListener('click', ()=>{ inputEl.value = ''; outEl.textContent = ''; });

clearBtn.addEventListener('click', ()=>{ inputEl.value = ''; outEl.textContent = ''; });
