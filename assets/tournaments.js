// Backend Requirements (API)
// For this to work, your backend (Node.js/Python/PHP) needs these endpoints:
// POST /api/tournaments/create: Saves name, date, venue.
// GET /api/tournaments/active: Returns JSON list [{id: 1, name: "UTM Open", date: "2024-12-01"}].
// POST /api/tournaments/register: Saves the athlete's application.
console.log("tournaments.js loaded");

document.addEventListener('DOMContentLoaded', function() {
    console.log("athlete form:", document.getElementById("athlete-registration-form"));

    
    const tournamentForm = document.getElementById('create-tournament-form');
    const tournListBody = document.getElementById('tournaments-list-body');
    const cancelTournBtn = document.getElementById('cancel-tourn-btn');
    const saveTournBtn = document.getElementById('save-tourn-btn');
    const formTitle = document.getElementById('tournament-form-title');

    
window.loadTournaments = function () {
    const tournListBody = document.getElementById('tournaments-list-body');
    if (!tournListBody) return;

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
                          <button class="btn-icon edit"
                            onclick="editTournament(${t.id}, '${t.name}', '${t.date}', '${t.venue}')">
                              <span class="material-symbols-rounded">edit</span>
                          </button>
                          <button class="btn-icon delete"
                            onclick="deleteTournament(${t.id})">
                              <span class="material-symbols-rounded">delete</span>
                          </button>
                      </div>
                  </td>
              </tr>
          `).join('');
      });
};

window.loadTournamentsDropdown = function () {
    const select = document.getElementById("tournament-select");
    if (!select) return;

    fetch("/api/tournaments/active")
        .then(res => res.json())
        .then(data => {
            if (!data.length) {
                select.innerHTML = `<option disabled>No tournaments available</option>`;
                return;
            }

            select.innerHTML =
                `<option value="" disabled selected>Select Tournament</option>` +
                data.map(t =>
                    `<option value="${t.id}">${t.name} (${t.date})</option>`
                ).join("");
        });
};

window.loadMyRegistrationHistory = function () {
    console.log("loadMyRegistrationHistory CALLED");

    const list = document.getElementById("my-history-list");
    if (!list) {
        console.log("my-history-list not found");
        return;
    }

    fetch("/api/tournaments/my-registrations")
        .then(res => res.json())
        .then(data => {
            console.log("history data:", data);

            if (!data.length) {
                list.innerHTML = "<li>No registrations yet</li>";
                return;
            }

            list.innerHTML = data.map(r => `
  <li>
    <strong>${r.tournament_name}</strong><br>
    Events: ${r.events || "—"}<br>
    
    Registered: ${new Date(r.registered_at).toLocaleDateString()}
  </li>
`).join("");

        });
};

window.loadAdminRegistrations = function () {
    const tbody = document.getElementById("admin-registrations-list");
    if (!tbody) return; // admin page guard

    fetch("/api/tournaments/admin-registrations")
        .then(res => res.json())
        .then(data => {
            if (!data.length) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7">No registrations found</td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = data.map(r => `
                <tr>
                    <td>${r.athlete}</td>
                    <td>${r.tournament}</td>
                    <td>${r.events}</td>
                    <td>${r.gender}</td>
                    <td>${r.contact_email}</td>
                    <td>${r.contact_phone}</td>
                    <td>${r.seed_time}</td>
                </tr>
            `).join("");
        })
        .catch(err => {
            console.error("Failed to load admin registrations", err);
        });
};





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

//athelete registration part

const athleteForm = document.getElementById("athlete-registration-form");

if (athleteForm) {
    athleteForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const formData = new FormData(athleteForm);

        const payload = {
            tournament_id: formData.get("tournament_id"),
            category: formData.get("category"),
            gender: formData.get("gender"),
            event_name: formData.get("event_name"),
            seed_time: formData.get("seed_time"),
            contact_name: formData.get("contact_name"),
            contact_email: formData.get("contact_email"),
            contact_phone: formData.get("contact_phone")
        };

        console.log("SUBMIT PAYLOAD =", payload);

        fetch("/api/tournaments/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("Registration submitted successfully!");
                athleteForm.reset();
            } else {
                alert(data.message || "Registration failed");
            }
        });
    });
}



});