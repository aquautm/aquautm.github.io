const dateInput = document.getElementById("attendance-date");
const nameInput = document.getElementById("att-name");
const statusInput = document.getElementById("att-status");
const addBtn = document.getElementById("add-attendance-btn");
const tableBody = document.getElementById("attendance-table-body");

// Store attendance by date (frontend-only)
const attendanceData = {};

// Add attendance record
addBtn.addEventListener("click", () => {
    const date = dateInput.value;
    const name = nameInput.value.trim();
    const status = statusInput.value;

    if (!date || !name) {
        alert("Please select a date and enter a name.");
        return;
    }

    if (!attendanceData[date]) {
        attendanceData[date] = [];
    }

    attendanceData[date].push({ name, status });

    nameInput.value = "";
    renderAttendance(date);
});

// Render attendance for selected date
function renderAttendance(date) {
    tableBody.innerHTML = "";

    if (!attendanceData[date] || attendanceData[date].length === 0) {
        tableBody.innerHTML = `<tr><td colspan="2">No attendance recorded</td></tr>`;
        return;
    }

    attendanceData[date].forEach(record => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${record.name}</td>
            <td>${record.status}</td>
        `;
        tableBody.appendChild(row);
    });
}

// When date changes
dateInput.addEventListener("change", () => {
    renderAttendance(dateInput.value);
});
