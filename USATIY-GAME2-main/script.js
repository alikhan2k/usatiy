async function fetchOptions() {
    const res = await fetch('/api/options');
    const options = await res.json();
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt.name;
        btn.onclick = () => vote(opt.id);
        optionsDiv.appendChild(btn);
    });
}

async function vote(optionId) {
    const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId })
    });

    if (res.ok) {
        alert('Спасибо за ваш голос!');
    } else {
        const text = await res.text();
        alert(text);
    }
}

async function fetchResults() {
    const res = await fetch('/api/results');
    const results = await res.json();
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    results.forEach(r => {
        const div = document.createElement('div');
        div.textContent = `${r.option}: ${r.count}`;
        resultsDiv.appendChild(div);
    });
}

fetchOptions();
fetchResults();
setInterval(fetchResults, 10000);
