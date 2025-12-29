const sidebar = document.querySelector(".sidebar");
const sidebarToggle = document.querySelector(".toggler");

sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
});

document.querySelectorAll(".menu-link").forEach(link => {
    link.addEventListener("click", e => {
        if (link.tagName === 'BUTTON' && link.form && link.form.action.includes('/logout')) {
            return;
        }

        e.preventDefault();

        document.querySelectorAll(".menu-link").forEach(l => l.classList.remove("active"));
        link.classList.add("active");

        document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));

        const sectionId = link.querySelector(".menu-label").textContent.trim().toLowerCase();
        const target = document.getElementById(sectionId);
        if (target) {
            target.classList.add("active");

            if (sectionId === "schedule" && window.calendar) {
                setTimeout(() => window.calendar.updateSize(), 100);
            }
            if (sectionId === "tournaments") {
                window.loadTournaments();
                window.loadTournamentsDropdown();
                window.loadMyRegistrationHistory();
                window.loadAdminRegistrations();
            }
            if (sectionId === "admin-feedback" || sectionId === "feedback") {
                if (window.loadFeedback) {
                    window.loadFeedback();
                }
            }
        }
    });
});
