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

