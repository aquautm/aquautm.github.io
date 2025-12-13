document.addEventListener("DOMContentLoaded", () => {
    loadUpcomingEvents();
    loadLatestAnnouncement();
    loadUserInfo();
    loadDashboardStats();
    loadUserActivityChart();
    loadRecentLogs();
});

function loadUpcomingEvents() {
    fetch('/api/dashboard/upcoming')
        .then(res => res.json())
        .then(events => {
            const container = document.getElementById('dashboard-events-list');
            
            if (events.length === 0) {
                container.innerHTML = '<p>No events scheduled for this week.</p>';
                return;
            }

            let html = '<ul style="list-style: none; padding: 0;">';
            events.forEach(event => {
                const dateOptions = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
                const dateStr = new Date(event.start_date).toLocaleDateString('en-US', dateOptions);
                
                html += `
                    <li style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                        <strong>${event.title}</strong><br>
                        <span style="font-size: 0.9em; color: #666;">${dateStr}</span>
                    </li>`;
            });
            html += '</ul>';

            container.innerHTML = html;
        })
        .catch(err => {
            console.error(err);
            document.getElementById('dashboard-events-list').innerHTML = '<p>Error loading events.</p>';
        });
}

function loadLatestAnnouncement() {
    fetch('/api/dashboard/announcement')
        .then(res => res.json())
        .then(announcement => {
            const container = document.getElementById('dashboard-announcement-content');

            if (!announcement) {
                container.innerHTML = '<p>No recent announcements.</p>';
                return;
            }

            const dateStr = new Date(announcement.created_at).toLocaleDateString();

            container.innerHTML = `
                <h4 style="margin-bottom: 5px; color: #007bff;">${announcement.title}</h4>
                <small style="color: #888;">Posted on ${dateStr}</small>
                <p style="margin-top: 10px;">${announcement.content}</p>
                <a href="#" onclick="document.querySelector('[data-target=announcements]').click(); return false;">View all</a>
            `;
        })
        .catch(err => {
            console.error(err);
            document.getElementById('dashboard-announcement-content').innerHTML = '<p>Error loading announcement.</p>';
        });
}

function loadUserInfo() {
    fetch('/me')
        .then(res => {
            if (!res.ok) throw new Error("Not logged in");
            return res.json();
        })
        .then(user => {
            const nameSpan = document.getElementById('dynamic-user-name');

            if (nameSpan && user.name) {
                const formattedName = user.name.charAt(0).toUpperCase() + user.name.slice(1);
                nameSpan.textContent = formattedName;
            }
        })
        .catch(err => {
            console.error("Error fetching user info:", err);
        });
}

function loadDashboardStats() {
    fetch('/api/dashboard/stats')
        .then(res => res.json())
        .then(stats => {
            document.getElementById('stats-total-users').textContent = stats.totalUsers;
            document.getElementById('stats-active-today').textContent = stats.activeToday;
            document.getElementById('stats-new-month').textContent = stats.newMonth;
            document.getElementById('stats-announcements').textContent = stats.announcements;
        })
        .catch(err => {
            console.error("Error loading dashboard stats:", err);
        });
}

function loadUserActivityChart() {
    fetch('/api/dashboard/user-activity')
        .then(res => res.json())
        .then(data => {
            const ctx = document.getElementById('user-activity-chart').getContext('2d');
            const labels = data.map(item => new Date(item.date).toLocaleDateString());
            const counts = data.map(item => item.count);

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Login Activity',
                        data: counts,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        })
        .catch(err => {
            console.error("Error loading user activity chart:", err);
        });
}

function loadRecentLogs() {
    fetch('/api/dashboard/recent-logs')
        .then(res => res.json())
        .then(logs => {
            const container = document.getElementById('recent-logs');
            if (logs.length === 0) {
                container.innerHTML = '<li>No recent activity.</li>';
                return;
            }

            let html = '';
            logs.forEach(log => {
                const dateStr = new Date(log.login_time).toLocaleString();
                html += `<li>${log.first_name} ${log.last_name} logged in from ${log.ip_address} at ${dateStr}</li>`;
            });
            container.innerHTML = html;
        })
        .catch(err => {
            console.error("Error loading recent logs:", err);
            document.getElementById('recent-logs').innerHTML = '<li>Error loading activity.</li>';
        });
}

function handleCreateAthlete(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    fetch('/api/admin/create-athlete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        const messageEl = document.getElementById('create-athlete-message');
        if (result.success) {
            messageEl.style.color = 'green';
            messageEl.textContent = result.message;
            event.target.reset(); // Clear the form
        } else {
            messageEl.style.color = 'red';
            messageEl.textContent = result.message;
        }
    })
    .catch(err => {
        console.error("Error creating athlete:", err);
        document.getElementById('create-athlete-message').style.color = 'red';
        document.getElementById('create-athlete-message').textContent = 'Error creating athlete account.';
    });
}

function loadMembers() {
    fetch('/api/admin/members')
        .then(res => res.json())
        .then(members => {
            const tbody = document.getElementById('members-list');
            if (!tbody) return;

            if (members.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">No members found.</td></tr>';
                return;
            }

            let html = '';
            members.forEach(member => {
                const roleClass = `role-${member.role}`;
                const fullName = `${member.first_name} ${member.last_name}`;
                const joinDate = new Date(member.created_at).toLocaleDateString();

                html += `
                    <tr data-member-id="${member.id}">
                        <td>
                            <div class="user-info">
                                <img src="/images/default-profile.png" alt="User" class="table-avatar">
                                <span class="user-name">${fullName}</span>
                            </div>
                        </td>
                        <td>${member.email}</td>
                        <td>
                            <span class="role-badge role-${member.role}">${member.role.charAt(0).toUpperCase() + member.role.slice(1)}</span>
                        </td>
                        <td><span class="status-dot active"></span> Active</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-icon delete" title="Remove User" data-user-id="${member.id}">
                                    <span class="material-symbols-rounded">delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;

            // Add event listeners for role changes and delete buttons
            setupMemberActions();
        })
        .catch(err => {
            console.error("Error loading members:", err);
            const tbody = document.getElementById('members-list');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="5">Error loading members.</td></tr>';
            }
        });
}

function setupMemberFilters() {
    const searchInput = document.getElementById('member-search');
    const roleFilter = document.getElementById('role-filter');

    if (searchInput) {
        searchInput.addEventListener('input', filterMembers);
    }
    if (roleFilter) {
        roleFilter.addEventListener('change', filterMembers);
    }
}

function filterMembers() {
    const searchTerm = document.getElementById('member-search')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('role-filter')?.value || 'all';
    const rows = document.querySelectorAll('#members-list tr');

    rows.forEach(row => {
        if (row.cells.length < 5) return; // Skip if not a data row

        const name = row.cells[0].textContent.toLowerCase();
        const email = row.cells[1].textContent.toLowerCase();
        const roleBadge = row.cells[2].querySelector('.role-badge');
        const role = roleBadge ? roleBadge.textContent.toLowerCase() : '';

        const matchesSearch = name.includes(searchTerm) || email.includes(searchTerm);
        const matchesRole = roleFilter === 'all' || role === roleFilter.toLowerCase();

        row.style.display = matchesSearch && matchesRole ? '' : 'none';
    });
}

function setupMemberActions() {
    // Role change handlers
    document.querySelectorAll('.role-select').forEach(select => {
        select.addEventListener('change', function() {
            const userId = this.dataset.userId;
            const saveBtn = document.querySelector(`.save-role[data-user-id="${userId}"]`);
            if (saveBtn) {
                saveBtn.style.display = 'inline-block';
            }
        });
    });

    // Save role changes
    document.querySelectorAll('.save-role').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.dataset.userId;
            const select = document.querySelector(`.role-select[data-user-id="${userId}"]`);
            const newRole = select.value;

            fetch(`/api/admin/members/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole })
            })
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    this.style.display = 'none';
                    alert('Role updated successfully!');
                } else {
                    alert('Error updating role: ' + result.error);
                }
            })
            .catch(err => {
                console.error("Error updating role:", err);
                alert('Error updating role.');
            });
        });
    });

    // Delete user handlers
    document.querySelectorAll('.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.dataset.userId;
            const row = this.closest('tr');
            const userName = row.cells[0].textContent.trim();

            if (confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
                fetch(`/api/admin/members/${userId}`, {
                    method: 'DELETE'
                })
                .then(res => res.json())
                .then(result => {
                    if (result.success) {
                        row.remove();
                        alert('User deleted successfully!');
                    } else {
                        alert('Error deleting user: ' + result.error);
                    }
                })
                .catch(err => {
                    console.error("Error deleting user:", err);
                    alert('Error deleting user.');
                });
            }
        });
    });
}

// Add event listener for the create athlete form
document.addEventListener("DOMContentLoaded", () => {
    const createAthleteForm = document.getElementById('create-athlete-form');
    if (createAthleteForm) {
        createAthleteForm.addEventListener('submit', handleCreateAthlete);
    }

    // Load members when members section becomes active
    const membersSection = document.getElementById('members');
    if (membersSection) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (membersSection.classList.contains('active')) {
                        loadMembers();
                        setupMemberFilters();
                    }
                }
            });
        });
        observer.observe(membersSection, { attributes: true });
    }
});
