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

document.getElementById("submitMessage").addEventListener("click", async function () {
    const message = document.getElementById("messageBox").value;
    const email = document.getElementById("email").value;
    const isPasswordReset = document.getElementById("passwordReset").checked;

    if (!email) {
        showError("Please provide an email address");
        return;
    }

    if (!message.trim()) {
        showError("Please provide a message");
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/contact`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email,
                message: message,
                isPasswordReset: isPasswordReset
            })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess("Message sent successfully");
        } else {
            showError("Error: " + data.message);
        }
    } catch (error) {
        console.error("Contact form submission failed:", error);
        showError("An error occurred while sending your message.");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
  
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  });

