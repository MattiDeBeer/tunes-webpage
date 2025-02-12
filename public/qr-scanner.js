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

function showDetails(){
    if (!window.loadedUser) {
        console.log("No user loaded")
        return
    }

    document.getElementById("userName").textContent = "Name: " + window.loadedUser.name;
    document.getElementById("userEmail").textContent = "Email: " + window.loadedUser.email;
    document.getElementById("userOrganisation").textContent = "Organisaton: " + window.loadedUser.organisation;
    document.getElementById("userSignedIn").textContent = "Signed in: " + window.loadedUser.signed_in;
    document.getElementById("qr-result").style.display = "block";
}

function hideDetails() {
    document.getElementById("qr-result").style.display = "none";
}

//navbar code
document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
  
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  });

// QR Scanner code
document.addEventListener("DOMContentLoaded", async function () {
    async function onScanSuccess(decodedText, decodedResult) {
        const token = localStorage.getItem("authToken");
        
        try {
            // Pause the scanner
            await qrScanner.stop();
        } catch (err) {
            console.error("Failed to stop the scanner:", err);
        }

        
        // Send scanned QR code data to the server (optional)
        const response = await fetch("/process-qr", {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json" },
                body: JSON.stringify({ qrData: decodedText }),
   });
        const result = await response.json();
        //console.log("Server Response:", result);

        if (response.status !== 200) {
            showError("Failed to get details: " + result.message);
            document.getElementById("resume-button").style.display = "block";
            return;
        }

        console.log('Success:', result);
        // Perform additional actions based on the successful response
        // For example, you can update the UI or redirect the user
        showSucess("QR code scanned successfully");

        console.log(result.signed_in)

        if (result.signed_in){
            document.getElementById("sign-button").style.backgroundColor = "red";
            document.getElementById("sign-button").textContent = "Sign user out"
        } else {
            document.getElementById("sign-button").style.backgroundColor = "green";
            document.getElementById("sign-button").textContent = "Sign user in"
        }
        
        window.loadedUser = result
        document.getElementById("sign-button").style.display = "block"
        document.getElementById("resume-button").style.display = "block";
        showDetails()



        
    }

    let qrScanner = new Html5Qrcode("qr-reader");
    qrScanner.start(
        { facingMode: "environment" },  // Use rear camera if available
        { fps: 10, qrbox: 250 },
        onScanSuccess
    );

    document.getElementById("resume-button").addEventListener("click", async () => {
        try {
            await qrScanner.start(
                { facingMode: "environment" },  // Use rear camera if available
                { fps: 10, qrbox: 250 },
                onScanSuccess
            );
            console.log("QR scanner resumed.");
            document.getElementById("qr-result").style.display = "none"
            document.getElementById("resume-button").style.display = "none";
            document.getElementById("sign-button").style.display = "none";
        } catch (err) {
            console.error("Failed to resume the scanner:", err);
        }
    });

    
    document.getElementById("sign-button").addEventListener("click", async function(event) {
        event.preventDefault(); // Prevent form refresh
    
        const token = localStorage.getItem("authToken"); // Get the admin token
        const userEmail = window.loadedUser.email;
        field = "signed_in";

        if (window.loadedUser.signed_in) {
            newValue = false;
        } else {
            newValue = true;
        }  
            
        console.log('Updating user:', userEmail, field, newValue);

        const response = await fetch("http://localhost:3000/admin/updateUser", {
           method: "POST",
           headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
                
            },
            body: JSON.stringify({ email: userEmail, field, newValue: newValue })
        });
    
        const result = await response.json();
        if (response.ok) {
            //alert("User updated successfully!");
            if (newValue) {
                showSucess("User signed in")
            } else {
                showSucess("User sigend out")
            }
        } else {
            showError("Error : " + result.message)
            //alert("Error: " + result.message);
        }        
    });
});

document.getElementById("return-to-dashboard").addEventListener("click", () => {
    window.location.href = "qr-scanner.html";
});
