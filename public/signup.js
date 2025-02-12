function showError(message) {
    const errorMessage = document.getElementById("message");
    errorMessage.textContent = message; // Update text
    errorMessage.classList.add("show-error"); // Add fade-in effect
  
    // Remove message after 3 seconds (optional)
    setTimeout(() => {
      errorMessage.classList.remove("show-error");
    }, 3000);
  }

function showSucess(message) {
    const errorMessage = document.getElementById("message");
    errorMessage.textContent = message; // Update text
    errorMessage.classList.add("show-sucess"); // Add fade-in effect
  
    // Remove message after 3 seconds (optional)
    setTimeout(() => {
      errorMessage.classList.remove("show-sucess");
    }, 3000);
  }

document.getElementById("signupForm").addEventListener("submit", async function(event) {
    event.preventDefault(); // Prevent page reload

    const newPassword = document.getElementById("newPassword").value;
    const newEmail = document.getElementById("newEmail").value;
    const newOrganisation = document.getElementById("newOrganisation").value;
    const newPhoneNumber = document.getElementById("newPhoneNumber").value;
    const newRepeatPassword = document.getElementById("newRepeatPassword").value;
    const newName = document.getElementById("newName").value;


    const response = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name : newName, password: newPassword , repeatPassword: newRepeatPassword,  email : newEmail, organisation : newOrganisation , phoneNumber : newPhoneNumber}),
    });

    const data = await response.json();
    if (data.message === "Account created successfully!") {
        showSucess(data.message);
        console.log(data.message);
        window.location.href = "index.html";
    } else {
        showError(data.message);
        console.log(data.message);
    }
   
    
});

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
});
