let userRole = "member";

// First get the user role
fetch("/me")
  .then(res => res.json())
  .then(user => {
    userRole = user.role;
    loadAnnouncements();
  });

function loadAnnouncements() {
  fetch("/announcements")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("announcements-list");
      container.innerHTML = "";

      data.forEach(a => {
        const div = document.createElement("div");
        div.className = "card";

        // ✅ Admin = editable inputs
        if (userRole === "admin") {
          div.innerHTML = `
            <input value="${a.title}" id="title-${a.id}">
            <textarea id="content-${a.id}">${a.content}</textarea>
            <input value="${a.link || ""}" id="link-${a.id}">
            <input value="${a.image_path || ""}" id="image-${a.id}">

            <button onclick="updateAnnouncement(${a.id})">Update</button>
            <button onclick="deleteAnnouncement(${a.id})" style="background:red;">Delete</button>
          `;
        } 
        
        else {
          div.innerHTML = `
            <h3>${a.title}</h3>
            <p>${a.content}</p>

            ${a.image_path ? `<img src="${a.image_path}" style="max-width:100%;border-radius:10px;">` : ""}

            ${a.link ? `<p><a href="${a.link}" target="_blank">Open Link</a></p>` : ""}

            <small>
              Posted on ${new Date(a.created_at).toLocaleString()}
            </small>
          `;
        }

        container.appendChild(div);
      });
    });
}

function deleteAnnouncement(id) {
  fetch(`/announcements/${id}`, { method: "DELETE" })
    .then(() => loadAnnouncements());
}

function updateAnnouncement(id) {
  const updatedData = {
    title: document.getElementById(`title-${id}`).value,
    content: document.getElementById(`content-${id}`).value,
    link: document.getElementById(`link-${id}`).value,
    image_path: document.getElementById(`image-${id}`).value
  };

  fetch(`/announcements/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedData)
  }).then(() => loadAnnouncements());
}
