const apiUrl = window.location.origin;

// Fetch QR code function
async function fetchQRCode() {
    try {
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
    } catch (error) {
        console.error("Error fetching QR Code:", error);
    }
}

// Show Large Alert with Dismiss
async function showDismissAlert(message) {
    if (message) {
        document.getElementById("terms-text").textContent = message;
    }
    const modal = document.getElementById("termsModal");
    const acceptBtn = document.getElementById("acceptBtn");
    const declineBtn = document.getElementById("declineBtn");
    const dismissBtn = document.getElementById("dismissBtn");

    // Show modal and configure buttons
    modal.style.display = "block";
    acceptBtn.style.display = "none";
    declineBtn.style.display = "none";
    dismissBtn.style.display = "block";

    return new Promise((resolve) => {
        const handleDismiss = () => {
            cleanup();
            resolve();
        };

        // Cleanup function
        const cleanup = () => {
            modal.style.display = "none";
            acceptBtn.style.display = "block";
            declineBtn.style.display = "block";
            dismissBtn.style.display = "none";
            dismissBtn.removeEventListener("click", handleDismiss);
        };

        // Add listener
        dismissBtn.addEventListener("click", handleDismiss);
    });
}

// Show Large Alert with Accept/Decline
async function showConfirmAlert(message) {
    document.getElementById("terms-text").textContent = message;
    document.getElementById("termsModal").style.display = "block";
    return new Promise((resolve) => {
        const acceptButton = document.getElementById("acceptBtn");
        const declineButton = document.getElementById("declineBtn");

        // Define the handler functions
        const handleAccept = () => {
            cleanup();
            resolve(true);
        };

        const handleDecline = () => {
            cleanup();
            resolve(false);
        };

        // Cleanup function to remove listeners and hide modal
        const cleanup = () => {
            document.getElementById("termsModal").style.display = "none";
            acceptButton.removeEventListener("click", handleAccept);
            declineButton.removeEventListener("click", handleDecline);
        };

        // Add the listeners
        acceptButton.addEventListener("click", handleAccept);
        declineButton.addEventListener("click", handleDecline);
    });
}

// Show message function
function showMessage(message, type, messageElementName) {
    const messageElement = document.getElementById(messageElementName);
    messageElement.textContent = message;
    messageElement.classList.add(`show-${type}`);

    setTimeout(() => {
        messageElement.classList.remove(`show-${type}`);
    }, 3000);
}

// Show error message
function showError(message, messageElementName) {
    showMessage(message, "error", messageElementName);
}

// Show success message
function showSuccess(message, messageElementName) {
    showMessage(message, "success", messageElementName);
}

// Show change form for text inputs
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

// Show change form for binary inputs (checkbox)
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

// Hide both change forms
function hideForms() {
    document.getElementById("changeDetailForm").style.display = 'none';
    document.getElementById("changeDetailFormBinary").style.display = 'none';
}

// Fetch all users and display them in a table
async function fetchUsers() {
    const token = localStorage.getItem("authToken");

    try {
        const response = await fetch(`${apiUrl}/admin/browseUsers`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`  // Ensure admin authentication
            }
        });

        const users = await response.json();
        const tableBody = document.querySelector("#userTable tbody");
        tableBody.innerHTML = ""; // Clear previous content

        users.forEach(user => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.organisation}</td>
                <td>${user.isSignedIn}</td>
                <td>
                    <button class="edit-btn">Edit</button>
                </td>
            `;

            tableBody.appendChild(row);

            // Attach event listener to the edit button
            row.querySelector(".edit-btn").addEventListener("click", () => editUser(user.email));
        });
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

// Load specified user details for editing
function editUser(email) {
    const emailElement = document.getElementById("getEmail");
    emailElement.value = email;

    // Scroll to the email input field and flash it
    const elementPosition = emailElement.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: elementPosition - 300, behavior: "smooth" });
    flashInput(emailElement);

    // Trigger the user detail fetch
    document.getElementById("get-user-details").click();
}

// Fetch sign-in logs and display them
async function fetchSignins() {
    try {
        const token = localStorage.getItem("authToken"); // Retrieve stored auth token
        if (!token) {
            alert("You must be logged in to view sign-ins!");
            return;
        }

        const response = await fetch(`${apiUrl}/logs/signins`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch sign-in logs");
        }

        const data = await response.json();
        displaySignins(data.logs); // Call function to update HTML

    } catch (error) {
        console.error("Error fetching sign-ins:", error);
        alert("Error fetching sign-in logs.");
    }
}

// Display sign-in logs in a table
function displaySignins(logs) {
    const tableBody = document.getElementById("siteLogsTableBody");
    tableBody.innerHTML = ""; // Clear old logs

    logs.forEach((log, index) => {
        const row = document.createElement("tr");

        const indexCell = document.createElement("td");
        indexCell.textContent = index + 1;

        const logCell = document.createElement("td");
        logCell.textContent = log;

        row.appendChild(indexCell);
        row.appendChild(logCell);
        tableBody.appendChild(row);
    });
}

// Fetch recent server logs and display them in a modal
async function fetchLogs() {
    try {
        const response = await fetch(`${apiUrl}/recentLogs`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("authToken")}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch logs");
        }

        const data = await response.json();
        const logContainer = document.getElementById("terms-text");
        logContainer.innerHTML = ""; // Clear previous logs

        // Loop through each log and create a new div element for it
        data.logs.forEach(log => {
            const logLine = document.createElement("div");
            logLine.textContent = log;
            logContainer.appendChild(logLine);
        });

        // Show the logs in a dismissable modal
        document.getElementById("alert-title").textContent = "Server Logs";
        await showDismissAlert();
        logContainer.innerHTML = ""; // Clear logs after modal is dismissed

    } catch (error) {
        console.error("Error fetching logs:", error);
    }
}

// Fetch open issues and display them in a table
async function fetchIssues() {
    try {
        const response = await fetch(`${apiUrl}/issues/getOpen`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${localStorage.getItem("authToken")}` }
        });

        const issues = await response.json();
        const tableBody = document.querySelector("#issuesTable tbody");
        tableBody.innerHTML = ""; // Clear existing rows

        issues.forEach(issue => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${issue.email}</td>
                <td>${issue.description}</td>
                <td>${new Date(issue.createdAt).toLocaleString()}</td>
                <td>
                    <button class="resolve-btn">Resolve</button>
                </td>
            `;
            tableBody.appendChild(row);

            // Attach event listener to the resolve button
            row.querySelector(".resolve-btn").addEventListener("click", () => resolveIssue(issue.id));
        });
    } catch (error) {
        console.error("Error fetching issues:", error);
    }
}
// Resolve an issue by its ID
async function resolveIssue(issueId) {
    document.getElementById("alert-title").textContent = "Are you sure?";
    const confirmation = await showConfirmAlert("Please make sure you have resolved this issue, and that you have notified the user that this issue has been resolved.");
    
    if (!confirmation) {
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/issues/resolve/${issueId}`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();
        fetchIssues(); // Refresh the table
    } catch (error) {
        console.error("Error resolving issue:", error);
    }
}

// Download server logs
async function downloadLogs() {
    try {
        const token = localStorage.getItem("authToken");

        if (!token) {
            alert("You are not authenticated. Please log in.");
            return;
        }

        const response = await fetch(`${apiUrl}/logs/download/serverLog`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to download logs");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "server_logs.txt";
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error downloading logs:", error);
    }
}

// Fetch user statistics and display them
function fetchUserStats() {
    const token = localStorage.getItem("authToken");

    fetch(`${apiUrl}/admin/userStats`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("signed-in-users").innerText = data.signedInUsers;
        document.getElementById("total-users").innerText = data.totalUsers;
    })
    .catch(error => console.error("Error fetching user stats:", error));
}

// Flash input field to draw attention
function flashInput(input) {
    if (input) {
        input.classList.add("flash-input");
        setTimeout(() => {
            input.classList.remove("flash-input");
        }, 2000); // Matches animation duration
    }
}

// Download the list of signed-in users
function downloadSignedInUsers() {
    const token = localStorage.getItem("authToken");

    fetch(`${apiUrl}/admin/downloadSignedInUsers`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error("Failed to download");
        return response.blob();
    })
    .then(blob => {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = "signedInUsers.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    })
    .catch(error => console.error("Download failed:", error));
}

// Fetch and display the list of signed-in users
async function fetchSignedInUsers() {
    const token = localStorage.getItem("authToken");

    fetch(`${apiUrl}/admin/signedInUsers`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(async data => {
        const tableBody = document.getElementById("signinLogsTableBody");
        const tableDiv = document.getElementById("table-div");
        document.getElementById("alert-title").textContent = "Users currently on site";
        
        tableBody.innerHTML = ""; // Clear previous data
        tableDiv.style.display = "block";

        data.forEach(user => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.organisation}</td>
                <td>${user.phoneNumber}</td>
                <td>${user.email}</td>
            `;
            tableBody.appendChild(row);
        });

        await showDismissAlert();
        tableBody.innerHTML = ""; // Clear previous data
        tableDiv.style.display = "none";
    })
    .catch(error => console.error("Error fetching signed-in users:", error));
}

document.addEventListener("DOMContentLoaded", async () => {
    // Function to add or update an alert
    const addOrUpdateAlert = async (level, message) => {
        document.getElementById("alert-title").textContent = "Are you sure?";
        const confirm = await showConfirmAlert("Are you sure you want to send this alert? This message will appear for all users when they log in!");
        if (!confirm) {
            return;
        }
        try {
            const token = localStorage.getItem("authToken");

            // Validate level value
            if (!['info', 'warning', 'critical'].includes(level)) {
                throw new Error('Level must be either "info", "warning", or "critical"');
            }

            const response = await fetch(`${apiUrl}/admin/addOrUpdateAlert`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ message, level })
            });

            const result = await response.json();
            if (response.ok) {
                showSuccess("Alert updated", "alert-message");
            } else {
                showError("Error: " + result.message, "alert-message");
            }
        } catch (error) {
            showError(error, "alert-message");
        }
    };

    // Function to handle form submission for user detail changes
    const handleFormSubmit = async (event, formId, email, field, newValue1, newValue2) => {
        event.preventDefault();

        if (newValue1 !== newValue2) {
            showError("Values do not match");
            return;
        }

        const response = await fetch(`${apiUrl}/admin/updateUser`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("authToken")}`
            },
            body: JSON.stringify({ email, field, newValue1, newValue2 })
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess("Updated successfully!", "change-user-message");
            handleUserDetailFetch(event, window.LoadedUserData.email, false);
        } else {
            showError("Error: " + result.message, "change-user-message");
        }
    };

    // Function to delete an alert
    const deleteAlert = async () => {
        document.getElementById("alert-title").textContent = "Are you sure?";
        const confirmation = await showConfirmAlert("Are you sure you want to delete this alert? This will remove it for all users!");
        if (!confirmation) {
            return;
        }

        const token = localStorage.getItem("authToken");

        const response = await fetch(`${apiUrl}/admin/deleteAlert`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();
        if (response.ok) {
            showSuccess("Alert deleted successfully!", "alert-message");
        } else {
            showError("Error: " + result.message, "alert-message");
        }
    };

    // Function to fetch user details for editing
    const handleUserDetailFetch = async (event, email, verbose) => {
        event.preventDefault();
        const token = localStorage.getItem("authToken");

        const response = await fetch(`${apiUrl}/admin/getUser?email=${encodeURIComponent(email)}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const user = await response.json();

        if (response.ok && verbose) {
            showSuccess("User Found", "fetch-message");
        } else {
            showError(user.message, "fetch-message");
        }

        window.LoadedUserData = user;

        document.getElementById("changeName").textContent = user.name;
        document.getElementById("changeEmail").textContent = user.email;
        document.getElementById("changeOrganisation").textContent = user.organisation;
        document.getElementById("changePhoneNumber").textContent = user.phoneNumber;

        const signedInElement = document.getElementById("changeSignedIn");
        signedInElement.textContent = user.isSignedIn ? "Yes" : "No";
        signedInElement.style.backgroundColor = user.isSignedIn ? "green" : "red";

        const adminElement = document.getElementById("changeAdmin");
        adminElement.textContent = user.isAdmin ? "Yes" : "No";
        adminElement.style.backgroundColor = user.isAdmin ? "green" : "red";

        document.getElementById("deleteUser").textContent = "Delete Account";
        document.getElementById("changePassword").textContent = "Change Password";
    };

    // Function to fetch the current alert
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
                document.getElementById("alertSeverity").value = result.level;
                document.getElementById("alertText").value = result.message + " \n \nThis is the current alert, delete it and resubmit to specify another alert ...";
            } else {
                console.log(result.message);
            }
        } catch (error) {
            console.error("Error fetching alert:", error);
        }
    };

    // Function to fetch admin details
    const fetchAdminDetails = async () => {
        const token = localStorage.getItem("authToken");

        if (!token) {
            window.location.href = "index.html";
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/user`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error("Failed to fetch user data: " + errorMessage);
            }

            const user = await response.json();
            window.LoadedAdminUserData = user;

            document.getElementById("name").textContent = user.name;
            document.getElementById("email").textContent = user.email;
            document.getElementById("organisation").textContent = user.organisation;

            document.getElementById("signedInLabel").textContent = user.isSignedIn ? "Yes" : "No";

            if (!user.isAdmin) {
                alert("Only admins can access this page");
                localStorage.removeItem("authToken");
                window.location.href = "index.html";
            }
        } catch (error) {
            alert("Error fetching user data:", error);
            localStorage.removeItem("authToken");
            window.location.href = "index.html";
        }
    };

    // Add event listeners for various actions
    const addChangeListener = (elementId, field, labelText) => {
        document.getElementById(elementId).addEventListener("click", () => {
            window.selectedField = field;
            showChangeForm(labelText);
        });
    };

    addChangeListener("changePassword", 'password', "Enter new password");
    addChangeListener("changeName", 'name', "Enter New Name");
    addChangeListener("changeEmail", 'email', "Enter New Email");
    addChangeListener("changeOrganisation", 'organisation', "Enter New Organisation");
    addChangeListener("changePhoneNumber", 'phoneNumber', "Enter New Phone Number");

    document.getElementById("changeSignedIn").addEventListener("click", () => {
        window.selectedField = 'isSignedIn';
        showChangeFormBinary("Toggle Signed In");
    });

    document.getElementById("changeAdmin").addEventListener("click", () => {
        window.selectedField = 'isAdmin';
        showChangeFormBinary("Toggle Admin");
    });

    document.getElementById("deleteUser").addEventListener("click", async () => {
        const token = localStorage.getItem("authToken");

        document.getElementById("alert-title").textContent = "Are you sure?";
        const confirmation = await showConfirmAlert("Are you sure you want to delete this user?");
        if (!confirmation) {
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/admin/deleteUser`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ email: window.LoadedUserData.email })
            });

            const data = await response.json();

            if (response.ok) {
                showSuccess("User deleted successfully!", "change-user-message");
            } else {
                showError("Error: " + data.message, "change-user-message");
            }
        } catch (error) {
            showError("Error: " + error, "change-user-message");
        }
    });

    document.getElementById("changeDetailForm").addEventListener("submit", (event) => {
        const newValue1 = document.getElementById("changeDetailInput1").value;
        const newValue2 = document.getElementById("changeDetailInput2").value;
        handleFormSubmit(event, "changeDetailForm", window.LoadedUserData.email, window.selectedField, newValue1, newValue2);
    });

    document.getElementById("changeDetailFormBinary").addEventListener("submit", (event) => {
        const newValue1 = document.getElementById("toggle").checked;
        handleFormSubmit(event, "changeDetailFormBinary", window.LoadedUserData.email, window.selectedField, newValue1, newValue1);
    });

    document.getElementById("logout").addEventListener("click", () => {
        localStorage.removeItem("authToken");
        window.location.href = "index.html";
    });

    document.getElementById("getUserForm").addEventListener("click", (event) => {
        const email = document.getElementById("getEmail").value;
        handleUserDetailFetch(event, email, true);
    });

    document.getElementById("qr-redirect").addEventListener("click", () => {
        window.location.href = "/qr-scanner.html";
    });

    document.getElementById("submitAlert").addEventListener("click", (event) => {
        const alertLevel = document.getElementById("alertSeverity").value;
        const alertText = document.getElementById("alertText").value;
        addOrUpdateAlert(alertLevel, alertText);
    });

    document.getElementById("deleteAlert").addEventListener("click", (event) => {
        deleteAlert();
    });

    document.getElementById("fetch-all-users-button").addEventListener("click", fetchUsers);
    document.getElementById("fetch-all-issues-button").addEventListener("click", fetchIssues);
    document.getElementById("fetch-recent-logs").addEventListener("click", fetchLogs);
    document.getElementById("download-logs").addEventListener("click", downloadLogs);
    document.getElementById("get-site-log").addEventListener("click", fetchSignins);
    document.getElementById("download-signedin").addEventListener("click", downloadSignedInUsers);
    document.getElementById("display-signed-in-users").addEventListener("click", fetchSignedInUsers);

    // Fetch initial data
    fetchAdminDetails();
    fetchQRCode();
    fetchAlert();
    fetchUserStats();

    // Toggle navigation menu
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });
});



  




