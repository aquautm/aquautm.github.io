let userRole = "member";

fetch("/me")
  .then(res => {
    if (!res.ok) throw new Error("Not logged in");
    return res.json();
  })
  .then(user => {
    userRole = user.role;
    loadAnnouncements();
  })
  .catch(() => {
    console.warn("Could not fetch /me, defaulting to member");
    loadAnnouncements(); // ✅ STILL LOAD ANNOUNCEMENTS
  });


function loadAnnouncements() {
  console.log("Loading announcements with Role:", userRole);
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
  <label>Title:</label>
  <input value="${a.title}" id="title-${a.id}" class="form-control">
  
  <label>Content:</label>
  <textarea id="content-${a.id}" class="form-control">${a.content}</textarea>
  
  <label>Link:</label>
  <input value="${a.link || ""}" id="link-${a.id}" class="form-control">
  
  <label>Image:</label>
  <input value="${a.image_path || ""}" id="image-${a.id}" class="form-control">

  <label>Target:</label>
  <select id="role-${a.id}" class="form-control">
      <option value="all" ${a.target_role === 'all' ? 'selected' : ''}>All</option>
      <option value="member" ${a.target_role === 'member' ? 'selected' : ''}>Members</option>
      <option value="athlete" ${a.target_role === 'athlete' ? 'selected' : ''}>Athletes</option>
  </select>
  <br>

  <button onclick="updateAnnouncement(${a.id})">Update</button>
  <button onclick="deleteAnnouncement(${a.id})" style="background:red;">Delete</button>
`;
        } else {
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
    image_path: document.getElementById(`image-${id}`).value,
    target_role: document.getElementById(`role-${id}`).value
  };

  fetch(`/announcements/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedData)
  }).then(() => loadAnnouncements());
}
