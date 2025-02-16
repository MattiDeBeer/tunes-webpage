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
    if (!window.loadedUser) {
        console.log("No user loaded");
        return;
    }

    document.getElementById("userName").textContent = "Name: " + window.loadedUser.name;
    document.getElementById("userEmail").textContent = "Email: " + window.loadedUser.email;
    document.getElementById("userOrganisation").textContent = "Organisation: " + window.loadedUser.organisation;
    document.getElementById("userSignedIn").textContent = "Signed in: " + window.loadedUser.isSignedIn;
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

// QR Scanner functionality
document.addEventListener("DOMContentLoaded", async function () {

    // Fetch user details using UUID
    async function getUserDetails(UUID) {
        const token = localStorage.getItem("authToken");

        try {
            const response = await fetch(`${apiUrl}/admin/fetchUserDetailsUUID?uuid=${UUID}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
    
            const result = await response.json();
    
            if (response.status !== 200) {
                showMessage("Failed to get details: " + result.message, "error");
                document.getElementById("resume-button").style.display = "block";
                return false;
            }
    
            console.log('Success:', result);
    
            if (result.isSignedIn) {
                document.getElementById("sign-button").style.backgroundColor = "red";
                document.getElementById("sign-button").textContent = "Sign user out";
            } else {
                document.getElementById("sign-button").style.backgroundColor = "green";
                document.getElementById("sign-button").textContent = "Sign user in";
            }
            
            window.loadedUser = result;
            document.getElementById("sign-button").style.display = "block";
            document.getElementById("resume-button").style.display = "block";
            showDetails();
            return true;
            
        } catch(err) {
            console.error("Error fetching user details:", err);
            showMessage("Error fetching user details: " + err, "error");
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
    document.getElementById("sign-button").addEventListener("click", async function(event) {
        event.preventDefault(); // Prevent form refresh
    
        const token = localStorage.getItem("authToken"); // Get the admin token
        const email = window.loadedUser.email;
        const field = "isSignedIn";
        const newValue1 = !window.loadedUser.isSignedIn;
        const newValue2 = newValue1;

        console.log('Updating user:', email, field, newValue1, newValue2);

        const response = await fetch(`${apiUrl}/admin/updateUser`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ email, field, newValue1, newValue2 })
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(newValue1 ? "User signed in" : "User signed out", "success");
            await getUserDetails(window.loadedUser.userId);
            showDetails();
        } else {
            showMessage("Error: " + result.message, "error");
        }        
    });
});

// Return to dashboard button functionality
document.getElementById("return-to-dashboard").addEventListener("click", () => {
    window.location.href = "admin-dashboard.html";
});
