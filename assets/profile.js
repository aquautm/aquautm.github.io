fetch("/profile")
  .then(res => res.json())
  .then(user => {
    const card = document.getElementById("profile-card");
    const options = { year: "numeric", month: "short", day: "numeric" };
    const formattedDate = user.created_at ? new Date(user.created_at).toLocaleDateString("en-US", options) : "N/A";

    const fields = {
      "Name": `${user.first_name} ${user.last_name}`,
      "Email": user.email,
      "Role": user.role,
      "Member Since": formattedDate,
    };

    let htmlContent = '<div class="profile-details-grid">';

    Object.entries(fields).forEach(([label, value]) => {
        htmlContent += `
            <div class="detail-label">${label}</div>
            <div class="detail-value">${value}</div>
        `;
    });

    htmlContent += '</div>';
    card.innerHTML = htmlContent;

    // Populate form fields
    document.getElementById("name").value = `${user.first_name} ${user.last_name}`;
    document.getElementById("email").value = user.email;

    // Set profile image
    const profileImg = document.getElementById("profile-img");
    if (profileImg) {
      profileImg.src = user.profile_pic || "/images/default-profile.png";
    }

    // Set toggles
    const twofaToggle = document.getElementById("twofa-toggle");
    if (twofaToggle) {
      twofaToggle.checked = user.twofa_enabled;
    }

    const notificationsToggle = document.getElementById("notifications-toggle");
    if (notificationsToggle) {
      notificationsToggle.checked = user.notifications_enabled;
    }
  })
  .catch(err => {
    console.error(err);
    document.getElementById("profile-card").innerHTML = '<p class="text-danger">Error loading profile.</p>';
  });

// Handle profile update form
const updateProfileForm = document.getElementById("update-profile-form");
if (updateProfileForm) {
  updateProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const messageEl = document.getElementById("profile-message");

    const nameValue = document.getElementById("name").value.trim();
    const [first_name, ...lastNameParts] = nameValue.split(" ");
    const last_name = lastNameParts.join(" ") || "";
    const email = document.getElementById("email").value.trim();

    try {
      const response = await fetch("/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name, last_name, email })
      });

      const result = await response.json();
      if (response.ok) {
        messageEl.textContent = result.message;
        messageEl.style.color = "green";
        // Reload profile data
        location.reload();
      } else {
        messageEl.textContent = result.error;
        messageEl.style.color = "red";
      }
    } catch (err) {
      console.error(err);
      messageEl.textContent = "Error updating profile";
      messageEl.style.color = "red";
    }
  });
}

// Handle password change form
const passwordForm = document.getElementById("password-form");
if (passwordForm) {
  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const messageEl = document.getElementById("password-message");

    const current_password = document.getElementById("current_password").value;
    const new_password = document.getElementById("new_password").value;
    const confirm_password = document.getElementById("confirm_password").value;

    if (new_password !== confirm_password) {
      messageEl.textContent = "New passwords do not match";
      messageEl.style.color = "red";
      return;
    }

    try {
      const response = await fetch("/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password, new_password })
      });

      const result = await response.json();
      if (response.ok) {
        messageEl.textContent = result.message;
        messageEl.style.color = "green";
        passwordForm.reset();
      } else {
        messageEl.textContent = result.error;
        messageEl.style.color = "red";
      }
    } catch (err) {
      console.error(err);
      messageEl.textContent = "Error changing password";
      messageEl.style.color = "red";
    }
  });
}

// Handle profile picture upload
const profilePicForm = document.getElementById("profile-pic-form");
if (profilePicForm) {
  profilePicForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const messageEl = document.getElementById("pic-message");
    const formData = new FormData(profilePicForm);

    try {
      const response = await fetch("/profile/picture", {
        method: "POST",
        body: formData
      });

      const result = await response.json();
      if (response.ok) {
        messageEl.textContent = result.message;
        messageEl.style.color = "green";
        // Update profile image
        document.getElementById("profile-img").src = result.profile_pic;
        profilePicForm.reset();
      } else {
        messageEl.textContent = result.error;
        messageEl.style.color = "red";
      }
    } catch (err) {
      console.error(err);
      messageEl.textContent = "Error uploading picture";
      messageEl.style.color = "red";
    }
  });
}

// Handle 2FA toggle
const twofaToggle = document.getElementById("twofa-toggle");
if (twofaToggle) {
  twofaToggle.addEventListener("change", async () => {
    try {
      const response = await fetch("/profile/2fa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: twofaToggle.checked })
      });

      const result = await response.json();
      if (!response.ok) {
        console.error(result.error);
        // Revert toggle on error
        twofaToggle.checked = !twofaToggle.checked;
      }
    } catch (err) {
      console.error(err);
      // Revert toggle on error
      twofaToggle.checked = !twofaToggle.checked;
    }
  });
}

// Handle notifications toggle
const notificationsToggle = document.getElementById("notifications-toggle");
if (notificationsToggle) {
  notificationsToggle.addEventListener("change", async () => {
    try {
      const response = await fetch("/profile/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: notificationsToggle.checked })
      });

      const result = await response.json();
      if (!response.ok) {
        console.error(result.error);
        // Revert toggle on error
        notificationsToggle.checked = !notificationsToggle.checked;
      }
    } catch (err) {
      console.error(err);
      // Revert toggle on error
      notificationsToggle.checked = !notificationsToggle.checked;
    }
  });
}
