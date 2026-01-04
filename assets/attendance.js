const dateInput = document.getElementById("add-att-date");
const nameInput = document.getElementById("add-att-name");
const statusInput = document.getElementById("add-att-status");
const addBtn = document.getElementById("add-att-btn");

const viewDateInput = document.getElementById("view-att-date");
const tableBody = document.getElementById("view-att-table");
const chartCanvas = document.getElementById("attendance-chart");

let attendanceData = JSON.parse(localStorage.getItem("attendance")) || {};
let attendanceChart = null;

// Add attendance
addBtn.addEventListener("click", () => {
    const date = dateInput.value;
    const name = nameInput.value.trim();
    const status = statusInput.value;

    if (!date || !name) {
        alert("Please fill all fields");
        return;
    }

    if (!attendanceData[date]) attendanceData[date] = [];
    attendanceData[date].push({ name, status });
    localStorage.setItem("attendance", JSON.stringify(attendanceData));

    nameInput.value = "";
    alert("Attendance added");
    renderAttendance(viewDateInput.value); // auto update table
    updateAverageChart(); // update pie chart
});
// View attendance when date changes
viewDateInput.addEventListener("change", () => {
    renderAttendance(viewDateInput.value);
    updateAverageChart();
});

// Render attendance table
function renderAttendance(date) {
    tableBody.innerHTML = "";

    if (!attendanceData[date] || attendanceData[date].length === 0) {
        tableBody.innerHTML = `<tr><td colspan="2">No attendance found</td></tr>`;
        return;
    }

    const students = [...new Set(attendanceData[date].map(r => r.name))];

    students.forEach(student => {
        const record = attendanceData[date].find(r => r.name === student);
        tableBody.innerHTML += `
            <tr>
                <td>${student}</td>
                <td>${record.status}</td>
            </tr>
        `;
    });
}

function calculateAttendancePercentage(studentName, semester) {
    let total = 0;
    let present = 0;

    for (let date in attendanceData) {
        const d = new Date(date);
        const month = d.getMonth() + 1;

        if (
            (semester === 1 && month >= 3 && month <= 9) || // Mar-Sep
            (semester === 2 && (month >= 10 || month <= 2)) // Oct-Feb
        ) {
            attendanceData[date].forEach(record => {
                if (record.name === studentName) {
                    total++;
                    if (record.status === "Present") present++;
                }
            });
        }
    }

    if (total === 0) return 0;
    return (present / total) * 100;
}

function calculateAverageAttendance(semester) {
    const studentSet = new Set();
    for (let date in attendanceData) {
        attendanceData[date].forEach(r => studentSet.add(r.name));
    }

    if (studentSet.size === 0) return 0;

    let totalPercent = 0;
    studentSet.forEach(student => {
        totalPercent += calculateAttendancePercentage(student, semester);
    });

    return (totalPercent / studentSet.size).toFixed(2);
}

function updateAverageChart() {
    const sem1 = calculateAverageAttendance(1);
    const sem2 = calculateAverageAttendance(2);

    const data = {
        labels: ["Semester 1", "Semester 2"],
        datasets: [{
            data: [sem1, sem2],
            backgroundColor: ["#4CAF50", "#FF9800"]
        }]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' },
            title: {
                display: true,
                text: "Average Attendance Percentage"
            }
        }
    };

    if (attendanceChart) attendanceChart.destroy();
    attendanceChart = new Chart(chartCanvas, { type: 'pie', data, options });
}

updateAverageChart();
