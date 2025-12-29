document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('feedback-table-body');
    const refreshBtn = document.getElementById('refresh-feedback-btn');

    window.loadFeedback = function() {
        console.log("Loading feedback...");

        if (!tableBody) return;
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Loading feedback...</td></tr>`;

        fetch('/api/admin/feedback')
            .then(res => {
                if (res.status === 403) throw new Error("Unauthorized: You are not an Admin.");
                if (!res.ok) throw new Error(`Server Error: ${res.status}`);
                return res.json();
            })
            .then(data => {
                renderFeedbackTable(data);
            })
            .catch(err => {
                console.error(err);
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error: ${err.message}</td></tr>`;
            });
    };

    function renderFeedbackTable(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No feedback messages found.</td></tr>`;
            return;
        }

        data.forEach(item => {
            const safeMsg = (item.message || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const safeUser = (item.user_name || 'Guest').replace(/</g, "&lt;").replace(/>/g, "&gt;");
            
            const roleClass = (item.role || '').toLowerCase() === 'athlete' ? 'role-athlete' : 'role-member';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color:#666; font-size:0.9em;">${item.date}</td>
                <td>
                    <div class="user-info">
                        <span class="user-name" style="font-weight:600;">${safeUser}</span>
                    </div>
                </td>
                <td><span class="role-badge ${roleClass}">${item.role || 'User'}</span></td>
                <td><div style="max-width: 400px; word-wrap: break-word;">${safeMsg}</div></td>
                <td>
                    <button class="btn-icon delete" onclick="deleteFeedback(${item.id})">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    window.deleteFeedback = function(id) {
        if(!confirm("Are you sure you want to delete this message?")) return;
        fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
                if(data.success) window.loadFeedback(); 
                else alert("Error deleting.");
            });
    };

    if(refreshBtn) {
        refreshBtn.addEventListener('click', window.loadFeedback);
    }
    
    if(document.getElementById('admin-feedback').classList.contains('active')) {
        window.loadFeedback();
    }
});