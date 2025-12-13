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
  })
  .catch(err => {
    console.error(err);
    document.getElementById("profile-card").innerHTML = '<p class="text-danger">Error loading profile.</p>';
  });