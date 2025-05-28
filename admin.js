async function fetchAdminOptions() {
    const res = await fetch('/api/options');
    const options = await res.json();
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    options.forEach(opt => {
        const div = document.createElement('div');
        div.textContent = opt.name + ' ';
        const del = document.createElement('button');
        del.textContent = 'Удалить';
        del.classList.add("delete-button");
        del.onclick = () => deleteOption(opt.id);
        div.appendChild(del);
        optionsDiv.appendChild(div);
    });

    fetchVotes();
}

async function addOption() {
    const name = document.getElementById('newOption').value;
    if (!name) return;
    await fetch('/api/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    document.getElementById('newOption').value = '';
    fetchAdminOptions();
}

async function deleteOption(id) {
    await fetch(`/api/options/${id}`, { method: 'DELETE' });
    fetchAdminOptions();
}

async function fetchVotes() {
    const res = await fetch('/api/votes');
    const votes = await res.json();
    const votesDiv = document.getElementById('votes');
    votesDiv.innerHTML = '';

    votes.forEach(vote => {
        const div = document.createElement('div');
        div.textContent = `${vote.timestamp} - ${vote.ip} - ${vote.option}`;
        votesDiv.appendChild(div);
    });
}

async function resetVotes() {
    await fetch('/api/votes', { method: 'DELETE' });
    alert('Все голоса сброшены!');
    fetchAdminOptions();
}

function exportCSV() {
    fetch('/api/votes')
    .then(res => res.json())
    .then(votes => {
        let csv = 'Время,IP,Вариант\n';
        votes.forEach(v => {
            csv += `${v.timestamp},${v.ip},${v.option}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'votes.csv';
        a.click();
    });
}

fetchAdminOptions();
