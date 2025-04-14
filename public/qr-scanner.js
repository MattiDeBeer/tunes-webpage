const apiUrl = window.location.origin;

// Display a message with a specific type (success or error)
function showMessage(message, type) {
    const errorMessage = document.getElementById("message");
    errorMessage.textContent = message; // Update text
    errorMessage.classList.add(`show-${type}`); // Add fade-in effect
  
    // Remove message after 3 seconds
    setTimeout(() => {
      errorMessage.classList.remove(`show-${type}`);
    }, 3000);
}

// Show user details on the page
function showDetails() {
    if (!window.loadedUser || !Array.isArray(window.loadedUser.fields)) {
      console.error("No loaded user or fields data available.");
      return;
    }
  
    const getField = (fieldName) => {
      const field = window.loadedUser.fields.find(f => f.field === fieldName);
      return field ? field.value : "N/A";
    };
  
    document.getElementById("userName").textContent = "Name: " + getField("name");
    document.getElementById("userEmail").textContent = "Email: " + getField("email");
    document.getElementById("userOrganisation").textContent = "Organisation: " + getField("organisation");
    document.getElementById("userSignedIn").textContent = "Signed in: " + (getField("isSignedIn") ? "Yes" : "No");
  
    document.getElementById("qr-result").style.display = "block";
  }
  

// Hide user details from the page
function hideDetails() {
    document.getElementById("qr-result").style.display = "none";
}

// Navbar toggle functionality
document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
  
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
});

async function loadUserFestivalsTable() {
    const userId = window.userId;
    const tableBody = document.getElementById("festival-table-body");
    console.log(tableBody);
  
    if (!userId || !tableBody) {
      console.error("Missing user UUID or table body element.");
      return;
    }
  
    // Clear existing table rows
    tableBody.innerHTML = "";
  
    try {
      const response = await fetch(`/admin/users/festivals/${userId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        }
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch user festivals.");
      }
  
      const affiliations = result.affiliations;
  
      if (!affiliations || affiliations.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 2;
        cell.textContent = "No festival affiliations found.";
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
      }
  
      affiliations.forEach(festival => {
        const row = document.createElement("tr");
  
        const nameCell = document.createElement("td");
        nameCell.textContent = festival.festivalName;
        row.appendChild(nameCell);
  
        const parkingCell = document.createElement("td");
        parkingCell.textContent = festival.parkingType;
        row.appendChild(parkingCell);
  
        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Error loading user festivals:", error);
      showDismissAlert("Error loading user festival affiliations.");
    }
  }
  

// QR Scanner functionality
document.addEventListener("DOMContentLoaded", async function () {

    // Fetch user details using UUID
    async function getUserDetails(UUID) {
        const token = localStorage.getItem("authToken");
      
        try {
          const response = await fetch(`/admin/users/details/${UUID}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
      
          const result = await response.json();
      
          if (!response.ok) {
            showMessage("Failed to get details: " + (result.message || "Unknown error"), "error");
            document.getElementById("resume-button").style.display = "block";
            return false;
          }
      
          // Extract sign-in status from result.fields
          let isSignedIn = false;
          if (Array.isArray(result.fields)) {
            const signInField = result.fields.find(f => f.field === "isSignedIn");
            if (signInField) {
              isSignedIn = signInField.value === true;
            }
          }
      
          // Update sign-in button
          const signButton = document.getElementById("sign-button");
          signButton.style.display = "block";
          signButton.style.backgroundColor = isSignedIn ? "red" : "green";
          signButton.textContent = isSignedIn ? "Sign user out" : "Sign user in";
      
          // Show resume button
          document.getElementById("resume-button").style.display = "block";
      
          // Store globally
          window.loadedUser = result;
          window.userId = UUID;
      
          // Show user info
          await loadUserFestivalsTable();
          showDetails();
      
          return true;
      
        } catch (err) {
          console.error("Error fetching user details:", err);
          showMessage("Error fetching user details: " + err.message, "error");
          return false;
        }
      }
      
      

    // Handle successful QR code scan
    async function onScanSuccess(decodedText, decodedResult) {
        try {
            // Pause the scanner
            await qrScanner.stop();
        } catch (err) {
            console.error("Failed to stop the scanner:", err);
        }

        if (await getUserDetails(decodedText)) {
            showMessage("QR code scanned successfully", "success");
        } else {
            showMessage("QR scan failed", "error");
        }
    }

    // Initialize QR scanner
    let qrScanner = new Html5Qrcode("qr-reader");
    qrScanner.start(
        { facingMode: "environment" },  // Use rear camera if available
        { fps: 10, qrbox: 250 },
        onScanSuccess
    );

    // Resume button functionality
    document.getElementById("resume-button").addEventListener("click", async () => {
        try {
            await qrScanner.start(
                { facingMode: "environment" },  // Use rear camera if available
                { fps: 10, qrbox: 250 },
                onScanSuccess
            );
            console.log("QR scanner resumed.");
            hideDetails();
            document.getElementById("resume-button").style.display = "none";
            document.getElementById("sign-button").style.display = "none";
        } catch (err) {
            console.error("Failed to resume the scanner:", err);
        }
    });

    // Sign button functionality
    document.getElementById("sign-button").addEventListener("click", async function (event) {
        event.preventDefault();
      
        const token = localStorage.getItem("authToken");
        const userId = window.userId;

        // Get current isSignedIn value from fields
        const isSignedInField = window.loadedUser.fields.find(f => f.field === "isSignedIn");
        const currentStatus = isSignedInField ? isSignedInField.value : false;
        const newStatus = !currentStatus;
      
        try {
          const response = await fetch("/admin/users/update", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              userId: userId,
              newDetails: {
                isSignedIn: newStatus
              }
            })
          });
      
          const result = await response.json();
      
          if (response.ok) {
            showMessage(newStatus ? "User signed in." : "User signed out.", "success");
            await getUserDetails(userId);
            showDetails();
          } else {
            showMessage("Error: " + result.message, "error");
          }
        } catch (error) {
          console.error("Error toggling sign-in state:", error);
          showMessage("An unexpected error occurred.", "error");
        }
      });
      
});

// Return to dashboard button functionality
document.getElementById("return-to-dashboard").addEventListener("click", () => {
    window.location.href = "admin-dashboard.html";
});
