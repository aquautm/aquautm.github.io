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
