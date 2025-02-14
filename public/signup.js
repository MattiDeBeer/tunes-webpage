const apiUrl = window.location.origin;

function showMessage(message, isSuccess) {
  const messageElement = document.getElementById("message");
  messageElement.textContent = message;
  messageElement.classList.add(isSuccess ? "show-success" : "show-error");

  setTimeout(() => {
    messageElement.classList.remove(isSuccess ? "show-success" : "show-error");
  }, 3000);
}

// Fetch the Terms and Conditions from the server
async function fetchTerms() {
  const response = await fetch(`${apiUrl}/terms`);
  const result = await response.json();
  return result.terms;
}

// Show terms and conditions modal
async function showTerms() {
  terms = await fetchTerms();

  document.getElementById("terms-text").textContent = terms;
  document.getElementById("termsModal").style.display = "Block";
  
  return new Promise((resolve) => {
    const acceptButton = document.getElementById("acceptBtn");
    const declineButton = document.getElementById("declineBtn");

    acceptButton.addEventListener("click", () => {
      document.getElementById("termsModal").style.display = "none";
      resolve(true);
    });

    declineButton.addEventListener("click", () => {
      document.getElementById("termsModal").style.display = "none";
      resolve(false);
    });
  });
}


async function handleSignup(event) {

  event.preventDefault();

  accept = await showTerms();

  if (!accept){
    showMessage("You must accept the terms and conditions", false)
    return
  }

  const formData = {
    name: document.getElementById("newName").value,
    password: document.getElementById("newPassword").value,
    repeatPassword: document.getElementById("newRepeatPassword").value,
    email: document.getElementById("newEmail").value,
    organisation: document.getElementById("newOrganisation").value,
    phoneNumber: document.getElementById("newPhoneNumber").value
  };

  try {
    const response = await fetch(`${apiUrl}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    showMessage(data.message, data.message === "Account created successfully!");
    console.log(data.message);

    if (data.message === "Account created successfully!") {
      document.getElementById("signupButton").disabled = true;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Error:", error);
    showMessage("An error occurred " + error, false);
  }
}

function setupMenuToggle() {
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

document.getElementById("signupForm").addEventListener("submit", handleSignup);
document.addEventListener("DOMContentLoaded", setupMenuToggle);
