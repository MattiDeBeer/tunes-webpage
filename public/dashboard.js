const apiUrl = window.location.origin;

// Fetch QR code function
async function fetchQRCode() {
    const response = await fetch(`${apiUrl}/user/qr`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        }
    });

    if (response.ok) {
        const qrCodeBlob = await response.blob();
        const qrCodeURL = URL.createObjectURL(qrCodeBlob);
        document.getElementById("qrCodeImg").src = qrCodeURL;
    } else {
        const errorMessage = await response.json();
        console.error("Failed to fetch QR Code: " + errorMessage.message);
    }
}

// Show alert modal with a message
async function showAlert(level, message) {
    document.getElementById("terms-text").textContent = message;
    document.getElementById("termsModal").style.display = "block";

    return new Promise((resolve) => {
        const dismissButton = document.getElementById("dismissButton");

        dismissButton.addEventListener("click", () => {
            document.getElementById("termsModal").style.display = "none";
            resolve(true);
        });
    });
}

// Show confirmation alert modal with accept and decline buttons
async function showConfirmAlert(message) {
    document.getElementById("terms-text").textContent = message;
    document.getElementById("dismissButton").style.display = "none";
    document.getElementById("acceptBtn").style.display = "block";
    document.getElementById("declineBtn").style.display = "block";
    document.getElementById("termsModal").style.display = "block";

    return new Promise((resolve) => {
        const acceptButton = document.getElementById("acceptBtn");
        const declineButton = document.getElementById("declineBtn");

        const handleAccept = () => {
            cleanup();
            resolve(true);
        };

        const handleDecline = () => {
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            document.getElementById("dismissButton").style.display = "block";
            document.getElementById("acceptBtn").style.display = "none";
            document.getElementById("declineBtn").style.display = "none";
            document.getElementById("termsModal").style.display = "none";
            acceptButton.removeEventListener("click", handleAccept);
            declineButton.removeEventListener("click", handleDecline);
        };

        acceptButton.addEventListener("click", handleAccept);
        declineButton.addEventListener("click", handleDecline);
    });
}

// Show a message with a specific type (success or error)
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

// Show form for changing user details
function showChangeForm(text) {
    const formA = document.getElementById("changeDetailForm");
    const formB = document.getElementById("changeDetailFormBinary");
    const formTitle = document.getElementById("ChangeUserDetailsTitle");
    const formLabel1 = document.querySelector("label[for='changeDetailInput1']");
    const formLabel2 = document.querySelector("label[for='changeDetailInput2']");

    formLabel1.textContent = text;
    formLabel2.textContent = text;
    formTitle.textContent = "Change " + window.selectedField;

    formB.style.display = 'none';
    formA.style.display = 'block';
}

// Show form for changing binary user details (e.g., isSignedIn)
function showChangeFormBinary(text) {
    const formA = document.getElementById("changeDetailForm");
    const formB = document.getElementById("changeDetailFormBinary");
    const formTitle = document.getElementById("ChangeUserDetailsTitle");
    const checkbox = document.getElementById("toggle");

    formTitle.textContent = window.selectedField === 'isSignedIn' ? "Change Signed In status" : "Change Admin status";
    checkbox.checked = window.LoadedUserData[window.selectedField] === true;

    formA.style.display = 'none';
    formB.style.display = 'block';
}

// Hide both forms
function hideForms() {
    document.getElementById("changeDetailForm").style.display = 'none';
    document.getElementById("changeDetailFormBinary").style.display = 'none';
}

// Fetch alert data from the server
const fetchAlert = async () => {
    const token = localStorage.getItem("authToken");

    try {
        const response = await fetch(`${apiUrl}/alert/get`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            showAlert(result.level, result.message);
        } else {
            console.log(result.message);
        }
    } catch (error) {
        console.error("Error fetching alert:", error);
    }
}

// Load user details and update the UI
const loadUserDetails = async () => {
    const token = localStorage.getItem("authToken");

    try {
        const response = await fetch(`${apiUrl}/user`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error("Failed to fetch user data" + errorMessage);
        }

        const user = await response.json();
        window.LoadedUserData = user;

        document.getElementById("name").textContent = user.name;
        document.getElementById("email").textContent = user.email;
        document.getElementById("organisation").textContent = user.organisation;
        document.getElementById("changeName").textContent = user.name;
        document.getElementById("changeEmail").textContent = user.email;
        document.getElementById("changeOrganisation").textContent = user.organisation;
        document.getElementById("changePhoneNumber").textContent = user.phoneNumber;

        const signedInElement = document.getElementById("changeSignedIn");
        signedInElement.textContent = user.isSignedIn ? "Yes" : "No";
        signedInElement.style.backgroundColor = user.isSignedIn ? "green" : "red";

        document.getElementById("deleteUser").textContent = "Delete Account";
        document.getElementById("changePassword").textContent = "Change Password";

        if (user.isAdmin) {
            window.location.href = "admin-dashboard.html";
        }
    } catch (error) {
        alert("Error fetching user data:", error);
        localStorage.removeItem("authToken");
        window.location.href = "index.html";
    }
}

// Add event listener for changing user details
const addChangeListener = (elementId, field, labelText) => {
    document.getElementById(elementId).addEventListener("click", () => {
        window.selectedField = field;
        showChangeForm(labelText);
    });
}

// Handle form submission for updating user details
const handleFormSubmit = async (event, formId, field, newValue1, newValue2) => {
    event.preventDefault();

    if (newValue1 !== newValue2) {
        showError("Values do not match");
        return;
    }

    const response = await fetch(`${apiUrl}/user/updateUser`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify({ field, newValue1, newValue2 })
    });

    const result = await response.json();
    if (response.ok) {
        showSuccess("Updated successfully!");
        loadUserDetails();
    } else {
        showError("Error: " + result.message);
    }
}

// Event listener for DOM content loaded
document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    await loadUserDetails();

    addChangeListener("changePassword", 'password', "Enter new password");
    addChangeListener("changeName", 'name', "Enter New Name");
    addChangeListener("changeEmail", 'email', "Enter New Email");
    addChangeListener("changeOrganisation", 'organisation', "Enter New Organisation");
    addChangeListener("changePhoneNumber", 'phoneNumber', "Enter New Phone Number");

    document.getElementById("changeSignedIn").addEventListener("click", () => {
        window.selectedField = 'isSignedIn';
        showChangeFormBinary("Toggle Signed In");
    });

    document.getElementById("deleteUser").addEventListener("click", async () => {
        const confirm = await showConfirmAlert("Are you sure you want to delete your account?");
        if (!confirm) {
            return;
        }

        const response = await fetch(`${apiUrl}/user/delete`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("authToken")}`
            }
        });

        const result = await response.json();
        if (response.ok) {
            alert("Successfully deleted account!");
            localStorage.removeItem("authToken");
            window.location.href = "index.html";
        } else {
            alert("Error: " + result.message);
        }
    });

    document.getElementById("changeDetailForm").addEventListener("submit", (event) => {
        const newValue1 = document.getElementById("changeDetailInput1").value;
        const newValue2 = document.getElementById("changeDetailInput2").value;
        handleFormSubmit(event, "changeDetailForm", window.selectedField, newValue1, newValue2);
    });

    document.getElementById("changeDetailFormBinary").addEventListener("submit", (event) => {
        const newValue1 = document.getElementById("toggle").checked;
        handleFormSubmit(event, "changeDetailFormBinary", window.selectedField, newValue1, newValue1);
    });

    document.getElementById("logout").addEventListener("click", () => {
        localStorage.removeItem("authToken");
        window.location.href = "index.html";
    });

    fetchQRCode();
    fetchAlert();

    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });
});
