// Backend Requirements (API)
// For this to work, your backend (Node.js/Python/PHP) needs these endpoints:
// POST /api/tournaments/create: Saves name, date, venue.
// GET /api/tournaments/active: Returns JSON list [{id: 1, name: "UTM Open", date: "2024-12-01"}].
// POST /api/tournaments/register: Saves the athlete's application.

document.addEventListener('DOMContentLoaded', function() {
    
    const tournamentForm = document.getElementById('create-tournament-form');
    const tournListBody = document.getElementById('tournaments-list-body');
    const cancelTournBtn = document.getElementById('cancel-tourn-btn');
    const saveTournBtn = document.getElementById('save-tourn-btn');
    const formTitle = document.getElementById('tournament-form-title');

    if (tournListBody) {
        loadTournaments();
    }

    function loadTournaments() {
        fetch('/api/tournaments/active')
        .then(res => res.json())
        .then(data => {
            tournListBody.innerHTML = data.map(t => `
                <tr>
                    <td><strong>${t.name}</strong></td>
                    <td>${t.date}</td>
                    <td>${t.venue}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon edit" onclick="editTournament(${t.id}, '${t.name}', '${t.date}', '${t.venue}')" title="Edit">
                                <span class="material-symbols-rounded">edit</span>
                            </button>
                            <button class="btn-icon delete" onclick="deleteTournament(${t.id})" title="Delete">
                                <span class="material-symbols-rounded">delete</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        });
    }

    if (tournamentForm) {
        tournamentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(tournamentForm);
            const id = formData.get('tournament_id');
            const isEdit = !!id;

            const url = isEdit ? `/api/tournaments/${id}` : '/api/tournaments/create';
            const method = isEdit ? 'PUT' : 'POST';

            fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(formData))
            })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    alert(isEdit ? 'Tournament Updated!' : 'Tournament Created!');
                    resetTournForm();
                    loadTournaments();
                } else {
                    alert('Error: ' + data.message);
                }
            });
        });

        cancelTournBtn.addEventListener('click', resetTournForm);
    }

    function resetTournForm() {
        tournamentForm.reset();
        document.getElementById('tournament_id').value = '';
        saveTournBtn.innerText = "Create Tournament";
        formTitle.innerText = "Create New Tournament";
        cancelTournBtn.style.display = "none";
    }

    window.deleteTournament = function(id) {
        if(confirm('Are you sure you want to delete this tournament? This will also remove all registrations associated with it.')) {
            fetch(`/api/tournaments/${id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
                if(data.success) { loadTournaments(); }
                else { alert('Failed to delete'); }
            });
        }
    };

    window.editTournament = function(id, name, date, venue) {
        document.getElementById('tournament_id').value = id;
        document.getElementById('tourn_name').value = name;
        document.getElementById('tourn_date').value = date;
        document.getElementById('tourn_venue').value = venue;

        saveTournBtn.innerText = "Update Tournament";
        formTitle.innerText = "Edit Tournament";
        cancelTournBtn.style.display = "inline-block";
        
        tournamentForm.scrollIntoView({ behavior: 'smooth' });
    };
});