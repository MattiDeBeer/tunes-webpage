
async function getUserDetails(email) {
    const token = localStorage.getItem('authToken'); // Get stored token

    try {
        const response = await fetch(`http://localhost:3000/user-details?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token  // Send token in headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Error:', data.message);
            return null;
        }

        //console.log('User Details:', data);
        return data; // Do something with the data (display on page, etc.)

    } catch (error) {
        console.error('Failed to fetch user details:', error);
    }
}

//get QR code function
async function fetchQRCode() {
    const response = await fetch("/user/qr", {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("authToken")}` // Send user token
        }
    });

    if (response.ok) {
        const qrCodeBlob = await response.blob(); // Convert response to an image blob
        const qrCodeURL = URL.createObjectURL(qrCodeBlob); // Create a temporary URL
        document.getElementById("qrCodeImg").src = qrCodeURL; // Set the image source
    } else {
        const errorMessage = await response.json();
        console.error("Failed to fetch QR Code: " + errorMessage.message);
    }
}

function showChangeForm(text) {
    const forma = document.getElementById("changeDetailForm");
    const formb = document.getElementById("changeDetailFormBinary");
    const formTitle = document.getElementById("ChangeUserDetailsTitle");
    const formLabel1 = document.querySelector("label[for='changeDetailInput1']");
    const formLabel2 = document.querySelector("label[for='changeDetailInput2']");

    formLabel1.textContent = text;
    formLabel2.textContent = text;
    formTitle.textContent = "Change " + window.selectedField;

    // Toggle visibility
    if (forma.style.display === 'none') {
        formb.style.display = 'none'; // Hide binary form
        forma.style.display = 'block'; // Show form
    }
}

function showChangeFormBinary(text) {
    const formb = document.getElementById("changeDetailForm");
    const forma = document.getElementById("changeDetailFormBinary");
    const formTitle = document.getElementById("ChangeUserDetailsTitle");
    const checkbox = document.getElementById("toggle");

    if (window.selectedField === 'signed_in') {
        formTitle.textContent = "Change Signed In status";
    } else {
        formTitle.textContent = "Change Admin status";
    }

    if (window.LoadedUserData[window.selectedField] === true) {
        checkbox.checked = true;
    } else {    
        checkbox.checked = false;
    }

    // Toggle visibility
    if (forma.style.display === 'none') {
        formb.style.display = 'none'; // Hide normal form
        forma.style.display = 'block'; // Show binary form
    }
}

function hideForms(){
    const formb = document.getElementById("changeDetailForm");
    const forma = document.getElementById("changeDetailFormBinary");

    formb.style.display = 'none';
    forma.style.display = 'none';
}


document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
        window.location.href = "index.html"; // Redirect if not logged in
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/admin", {
            method: "GET",
            headers: {
                "Authorization": token, // Send token to backend
                "Content-Type": "application/json",
            },
        });

        if (response.status === 403) {
            alert("Unauthorized access");
            localStorage.removeItem("authToken"); // Remove token
            window.location.href = "index.html"; // Redirect to login page
        } else if (!response.ok) {
            window.localStorage.removeItem("authToken");
            alert("Failed to fetch user data");
        }

        const user = await response.json();
        document.getElementById("name").textContent = user.name;
        document.getElementById("email").textContent = user.email;
        document.getElementById("organisation").textContent = user.organisation;
        window.currentAdminEmail = user.email;
    } catch (error) {
        console.error("Error fetching user data:", error);
        //window.location.href = "index.html"; // Redirect if token is invalid
    }
});

document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("authToken"); // Remove token
    window.location.href = "index.html"; // Redirect to login page
});

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
  
    const form = document.getElementById('getUserForm');
  
    // Add an event listener for the submit event
    form.addEventListener('submit', async function(event) {
      event.preventDefault(); // Prevent the form from submitting the traditional way
  
      // Create a FormData object from the form
      const formData = new FormData(form);
  
      // You can now access the form data like this:
      const email = formData.get('email');

      //Hide forms
      hideForms();

      console.log('Getting data for:', email);

      window.LoadedUserData = await getUserDetails(email);
      const data = window.LoadedUserData;

      console.log('User Details:', data);
    
      if (data === null) {
        console.log('User not found');
        document.getElementById("userDetailsTitle").textContent = "Data not found";
        return;
      }

      window.LoadedUserEmail = data.email;

      document.getElementById("userDetailsTitle").style.display = "none"
      document.getElementById("changeName").textContent = data.name;
      document.getElementById("changeEmail").textContent = data.email;
      document.getElementById("changeOrganisation").textContent = data.organisation;
      document.getElementById("changePhoneNumber").textContent = data.phoneNumber;
      document.getElementById("changeSignedIn").textContent = data.signed_in;
      document.getElementById("changeAdmin").textContent = data.admin;
      document.getElementById("deleteUser").textContent = "Delete User";
      document.getElementById("changePassword").textContent = "Change Password";
    });

    // Add event listeners for the buttons
    document.getElementById("deleteUser").addEventListener("click", async () => {
        console.log("Delete User button clicked");
        token = localStorage.getItem("authToken");
        userEmail = window.LoadedUserEmail;

        if(!confirm("Are you sure you want to delete this user?")) {
            return;
        }
        
        const response = await fetch("http://localhost:3000/admin/deleteUser", {
            method: "POST",
            headers: {
                 "Content-Type": "application/json",
                 "Authorization": `Bearer ${token}`
             },
             body: JSON.stringify({ email: userEmail})
         });
        
        const result = await response.json();

        if (response.ok) {
            alert("User updated successfully!" + result.message);
            if (userEmail === window.currentAdminEmail) {
                window.localStorage.removeItem("authToken");
                window.location.href = "index.html";
            }

        } else {
            alert("Error: " + result.message);
        }


    });

    document.getElementById("changePassword").addEventListener("click", () => {
        window.selectedField = 'password';
        const value = window.LoadedUserData[window.selectedField];
        console.log('Selected Field Value:', value);
        console.log("Change Name button clicked");
        showChangeForm("Enter new password");
    });

    document.getElementById("changeName").addEventListener("click", () => {
        window.selectedField = 'name';
        const value = window.LoadedUserData[window.selectedField];
        console.log('Selected Field Value:', value);
        console.log("Change Name button clicked");
        showChangeForm("Enter New Name");
    });

    document.getElementById("changeEmail").addEventListener("click", () => {
        window.selectedField = 'email';
        const value = window.LoadedUserData[window.selectedField];
        console.log('Selected Field Value:', value);
        console.log("Change Email button clicked");
        showChangeForm("Enter New Email");
    });

    document.getElementById("changeOrganisation").addEventListener("click", () => {
        window.selectedField = 'organisation';
        const value = window.LoadedUserData[window.selectedField];
        console.log('Selected Field Value:', value);
        console.log("Change Organisation button clicked");
        showChangeForm("Enter New Organisation");
    });

    document.getElementById("changePhoneNumber").addEventListener("click", () => {
        window.selectedField = 'phoneNumber';
        const value = window.LoadedUserData[window.selectedField];
        console.log('Selected Field Value:', value);
        console.log("Change Phone Number button clicked");
        showChangeForm("Enter New Phone Number");
    });

    document.getElementById("changeSignedIn").addEventListener("click", () => {
        window.selectedField = 'signed_in';
        const value = window.LoadedUserData[window.selectedField];
        showChangeFormBinary("Toggle Signed In");
        console.log("Change Signed In button clicked");
    });

    document.getElementById("changeAdmin").addEventListener("click", () => {
        window.selectedField = 'admin';
        const value = window.LoadedUserData[window.selectedField];
        showChangeFormBinary("Toggle Admin");
        console.log('Selected Field Value:', value);
        console.log("Change Admin button clicked");
        
    });


    document.getElementById("changeDetailForm").addEventListener("submit", async function(event) {
        event.preventDefault(); // Prevent form refresh
    
        const token = localStorage.getItem("authToken"); // Get the admin token
        const userEmail = window.LoadedUserEmail;
        const field = window.selectedField;

        const newValue1 = document.getElementById("changeDetailInput1").value;
        const newValue2 = document.getElementById("changeDetailInput2").value;

        if (newValue1 !== newValue2) {
            alert("Values do not match");
            return;
        }
        
        console.log('Updating user:', userEmail, field, newValue1);

        const response = await fetch("http://localhost:3000/admin/updateUser", {
           method: "POST",
           headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ email: userEmail, field, newValue: newValue1 })
        });
    
        const result = await response.json();
        if (response.ok) {
            alert("User updated successfully!");
            window.location.reload(); // Refresh the page
        } else {
            alert("Error: " + result.message);
        }



        
    });

    document.getElementById("changeDetailFormBinary").addEventListener("submit", async function(event) {
        event.preventDefault(); // Prevent form refresh
    
        const token = localStorage.getItem("authToken"); // Get the admin token
        const userEmail = window.LoadedUserEmail;
        const field = window.selectedField;

        const newValue = document.getElementById("toggle").checked;
        
        console.log('Updating user:', userEmail, field, newValue);

        const response = await fetch("http://localhost:3000/admin/updateUser", {
           method: "POST",
           headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ email: userEmail, field, newValue: newValue })
        });
    
        const result = await response.json();
        if (response.ok) {
            alert("User updated successfully!");
            window.location.reload(); // Refresh the page
        } else {
            alert("Error: " + result.message);
        }
    });

    document.addEventListener("DOMContentLoaded", () => {
        const menuToggle = document.querySelector(".menu-toggle");
        const navLinks = document.querySelector(".nav-links");
      
        menuToggle.addEventListener("click", () => {
          navLinks.classList.toggle("active");
        });
      });
    
      document.getElementById("qr-redirect").addEventListener("click", () => {
        window.location.href = "qr-scanner.html";
    });


});

// Call this function when the page loads
document.addEventListener("DOMContentLoaded", fetchQRCode);


  




