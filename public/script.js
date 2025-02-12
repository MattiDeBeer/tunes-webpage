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

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("authToken");

    if (token) {
        window.location.href = "dashboard.html"; // Redirect if token exists
    }
});


document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevents form submission
  
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    try {
      // Make the fetch request to the backend server
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({email, password}),
      });
  
    // If the response is not ok, handle the error
    if (!response.ok) {
      const errorData = await response.json(); // Parse the error response
      console.error('Error:', errorData.message);
      
      showError("Invalid email or password"); // Show error message
      
      
      return;
    }
  
      // If login is successful, handle the response (e.g., save token, redirect, etc.)
      const data = await response.json(); // Parse the successful response
      showSucess("Login successful");
      
      // Optionally, redirect to the user profile page after successful login
      // Store token in localStorage
      localStorage.setItem("authToken", data.token);

      // Redirect to dashboard
      window.location.href = "dashboard.html";


    } catch (error) {
      console.error('Error:', error);
    }
  });

  
  document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
  
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  });
  
  document.getElementById("createAccountButton").addEventListener("click", function() {
    window.location.href = "/signup.html"; // Redirect to signup page
  });
  