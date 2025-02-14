const apiUrl = window.location.origin;

function showMessage(message, type) {
    const messageElement = document.getElementById("message");
    messageElement.textContent = message;
    messageElement.classList.add(`show-${type}`);

    setTimeout(() => {
        messageElement.classList.remove(`show-${type}`);
    }, 3000);
}

function showError(message) {
    showMessage(message, "error");
}

function showSuccess(message) {
    showMessage(message, "success");
}

document.getElementById("submitMessage").addEventListener("click", async function() {
    const message = document.getElementById("messageBox").value;
    const email = document.getElementById("email").value;

    if (!email) {
        showError("Please provide an email address");
        return
    }

    if (!message.trim()) {
        showError("Please provide a messege");
        return;
    }

    const response = await fetch(`${apiUrl}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, message: message })
    });

    const data = await response.json();

    if (response.ok) {
        showSuccess("Message sent successfully");
    } else {
        showError("Error: " + data.message);
    }
    

});

document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
  
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  });

