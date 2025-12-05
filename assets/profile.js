const profileImg = document.getElementById("profile-img");
const profileCard = document.getElementById("profile-card");
const profileForm = document.getElementById("profile-pic-form");
const profileInput = document.getElementById("profile_pic");

fetch("/profile")
  .then(res => res.json())
  .then(user => {
    const card = document.getElementById("profile-card");
    const options = { year: "numeric", month: "short", day: "numeric" };
    const formattedDate = new Date(user.created_at).toLocaleDateString("en-US", options);


    const fields = {
      "Name": user.first_name + " " + user.last_name,
      "Email": user.email,
      "2FA Enabled": user.twofa_enabled ? "Yes" : "No",
      "Member Since": formattedDate,
      "Role": user.role,
    };
    
    card.innerHTML = Object.entries(fields)
      .map(([label, value]) => `
        <p><strong>${label}:</strong> ${value}</p>
      `)
      .join("");
  })
  .catch(err => {
    document.getElementById("profile-card").innerHTML = "<p>Error loading profile.</p>";
  });

  profileInput.addEventListener("change", function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      profileImg.src = e.target.result;
      profileImg.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
});

profileForm.addEventListener("submit", function(event) {
  event.preventDefault();
  const formData = new FormData();
  formData.append("profile_pic", profileInput.files[0]);

  fetch("/profile/upload", {
    method: "POST",
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.success && data.profile_picture_url) {
      profileImg.src = data.profile_picture_url;
      profileImg.style.display = "block";
      alert("Profile picture updated successfully!");
    } else {
      alert("Failed to upload profile picture.");
    }
  })
  .catch(err => {
    console.error(err);
    alert("Error uploading profile picture.");
  });
});


