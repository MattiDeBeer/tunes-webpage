document.getElementById("submitMessage").addEventListener("click", async function() {
    const message = document.getElementById("messageBox").value;
    const email = document.getElementById("email").value;

    if (!email) {
        const messageStatus = document.getElementById("messageStatus");
        messageStatus.textContent = "Please provide an email address";
        messageStatus.style.color = "red";
        return;
    }

    if (!message.trim()) {
        const messageStatus = document.getElementById("messageStatus");
        messageStatus.textContent = "Please provide a messege";
        messageStatus.style.color = "red";
        return;
    }

    const response = await fetch("http://localhost:3000/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({email, message})
    });

    const data = await response.json();
    document.getElementById("messageStatus").textContent = data.message;

});

document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
  
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  });

