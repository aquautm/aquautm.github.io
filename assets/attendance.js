const dateInput = document.getElementById("add-att-date");
const nameInput = document.getElementById("add-att-name");
const statusInput = document.getElementById("add-att-status");
const addBtn = document.getElementById("add-att-btn");

const viewDateInput = document.getElementById("view-att-date");
const tableBody = document.getElementById("view-att-table");

let attendanceData = JSON.parse(localStorage.getItem("attendance")) || {};

// Add attendance
addBtn.addEventListener("click", () => {
    const date = dateInput.value;
    const name = nameInput.value.trim();
    const status = statusInput.value;

    if (!date || !name) {
        alert("Please fill all fields");
        return;
    }

    if (!attendanceData[date]) {
        attendanceData[date] = [];
    }

    attendanceData[date].push({ name, status });

    localStorage.setItem("attendance", JSON.stringify(attendanceData));

    nameInput.value = "";
    alert("Attendance added");
});

// View attendance
viewDateInput.addEventListener("change", () => {
    renderAttendance(viewDateInput.value);
});

function renderAttendance(date) {
    tableBody.innerHTML = "";

    if (!attendanceData[date] || attendanceData[date].length === 0) {
        tableBody.innerHTML = `<tr><td colspan="2">No attendance found</td></tr>`;
        return;
    }

    attendanceData[date].forEach(record => {
        tableBody.innerHTML += `
            <tr>
                <td>${record.name}</td>
                <td>${record.status}</td>
            </tr>
        `;
    });
}
