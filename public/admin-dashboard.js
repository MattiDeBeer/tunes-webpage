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

async function searchUsers(query) {
    try {
      const response = await fetch(`/admin/users/search?query=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });
      const users = await response.json();
      console.log(users); // Or display them in a table
    } catch (err) {
      console.error("User search failed:", err);
    }
  }

// Show Large Alert with Dismiss
async function showDismissAlert(message) {
    const termsTextElement = document.getElementById("terms-text");
    if (message) {
        termsTextElement.innerHTML = `<h1>${message}</h1>`;
    }
    const modal = document.getElementById("termsModal");
    const acceptBtn = document.getElementById("acceptBtn");
    const declineBtn = document.getElementById("declineBtn");
    const dismissBtn = document.getElementById("dismissBtn");

    // Ensure modal appears above all others
    modal.style.zIndex = "9999";

    // Show modal and configure buttons
    modal.style.display = "block";
    acceptBtn.style.display = "none";
    declineBtn.style.display = "none";
    dismissBtn.style.display = "block";

    modal.style.maxWidth = "500px";
    modal.style.maxHeight = "500px";

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
    const termsTextElement = document.getElementById("terms-text");
    termsTextElement.innerHTML = `<h1>${message}</h1>`;
    const modal = document.getElementById("termsModal");
    modal.style.display = "block";
    modal.style.maxWidth = "500px";
    modal.style.maxHeight = "500px";
    modal.style.zIndex = "9999";
    return new Promise((resolve) => {
        const acceptButton = document.getElementById("acceptBtn");
        const declineButton = document.getElementById("declineBtn");

        // Set button colors
        acceptButton.style.backgroundColor = "green";
        acceptButton.style.color = "white";
        declineButton.style.backgroundColor = "red";
        declineButton.style.color = "white";

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


async function loadUserFestivals(containerId) {
    const container = document.getElementById(containerId);
    const token = localStorage.getItem("authToken");
  
    if (!token) {
      container.innerHTML = "<p>No token found. Please log in.</p>";
      return;
    }
  
    try {
      const res = await fetch("/user/festivals", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const festivals = await res.json();
  
      if (!festivals.length) {
        container.innerHTML = "<p>No associated festivals found. Please add the relevant festivals for yourself.</p>";
        return;
      }
  
      // Create table wrapper for scroll + sticky header support
      const wrapper = document.createElement("div");
      wrapper.className = "table-wrapper";
  
      // Create clean-table
      const table = document.createElement("table");
      table.className = "clean-table";
  
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
  
      ["Festival Name", "Current Parking"].forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
      });
  
      thead.appendChild(headerRow);
      table.appendChild(thead);
  
      const tbody = document.createElement("tbody");
  
      festivals.forEach(festival => {
        const row = document.createElement("tr");
  
        const nameCell = document.createElement("td");
        nameCell.textContent = festival.name;
  
        const parkingCell = document.createElement("td");
        parkingCell.textContent = festival.UserFestival?.parkingType || "Standard";
  
        row.appendChild(nameCell);
        row.appendChild(parkingCell);
        tbody.appendChild(row);
      });
  
      table.appendChild(tbody);
      wrapper.appendChild(table);
      container.innerHTML = ""; // clear old content
      container.appendChild(wrapper);
  
    } catch (err) {
      console.error("Error loading festivals:", err);
      container.innerHTML = "<p>Error loading festivals.</p>";
    }
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

        const logs = data.logs
        const tableBody = document.getElementById("siteLogsTableBody");
        const tableHead = document.getElementById("siteLogsTableHead");

        tableHead.innerHTML = `
            <tr>
                <th>#</th>
                <th>Details</th>
            </tr>
        `;


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

    } catch (error) {
        console.error("Error fetching sign-ins:", error);
        alert("Error fetching sign-in logs.");
    }
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

async function sendEmail(email, subject, message) {
    const token = localStorage.getItem("authToken");
  
    try {
      const response = await fetch("/admin/sendEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email, subject, message })
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.message || "Failed to send email");
      }

      return true;
    } catch (err) {
      console.error("Error sending email:", err);
      showDismissAlert("Error sending email: " + err.message);
      return false;
    }
  }
  

async function resetPassword(issue) {
    console.log(issue)
    if (!issue.user) {
        const resolve = await showConfirmAlert("There is no account associated with this email. Would you like automatically the user and mark this issue as resolved?");
        if (resolve) {
            await sendEmail(issue.email,"Password Reset",`
                Hi,

                We noticed that you requested a password reset, but there is no account associated with this email address in our system.

                If you believe this is an error or would like to create an account, please contact our support team or visit our registration page.

                Best regards,  
                The Tunes Festivals Team
                ` );
            await resolveIssue(issue.id);
            fetchIssues();
        }
    } else {
        const sucess = await changePassword(issue.user.userId,issue.email);
        if (sucess) {
            resolveIssue(issue.id);
            fetchIssues();
        } else {
            showDismissAlert("An error occured, so the issue has not been marked as resolved.");
        }
    }       
}

async function showFestivalAdminModal() {
  const existing = document.getElementById("festivalAdminModal");
  if (existing) existing.remove();

  const token = localStorage.getItem("authToken");

  let festivals = [];
  try {
    const res = await fetch("/festivals", {
      headers: { Authorization: `Bearer ${token}` }
    });
    festivals = await res.json();
  } catch (err) {
    showDismissAlert("Failed to load festivals.");
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "festivalAdminModal";
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "5000";

  const modal = document.createElement("div");
  modal.style.backgroundColor = "#fff";
  modal.style.padding = "2rem";
  modal.style.borderRadius = "10px";
  modal.style.maxWidth = "900px";
  modal.style.width = "90%";
  modal.style.maxHeight = "90vh";
  modal.style.overflowY = "auto";
  modal.style.boxShadow = "0 0 15px rgba(0,0,0,0.2)";

  const title = document.createElement("h3");
  title.textContent = "Edit Festival Details";
  modal.appendChild(title);

  const table = document.createElement("table");
  table.className = "clean-table";
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Name</th>
      <th>Location</th>
      <th>Start Date</th>
      <th>End Date</th>
      <th>Induction Link</th>
      <th>Actions</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  festivals.forEach(festival => {
    const row = document.createElement("tr");

    const nameInput = document.createElement("input");
    nameInput.value = festival.name;

    const locationInput = document.createElement("input");
    locationInput.value = festival.location;

    const startInput = document.createElement("input");
    startInput.type = "date";
    startInput.value = festival.startDate;

    const endInput = document.createElement("input");
    endInput.type = "date";
    endInput.value = festival.endDate;

    const linkInput = document.createElement("input");
    linkInput.value = festival.inductionLink || "";

    [nameInput, locationInput, startInput, endInput, linkInput].forEach(input => {
      input.style.width = "100%";
      input.style.padding = "0.25rem";
    });

    const cells = [
      nameInput, locationInput, startInput, endInput, linkInput
    ].map(input => {
      const td = document.createElement("td");
      td.appendChild(input);
      return td;
    });

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.onclick = async () => {
      try {
        const response = await fetch(`/admin/festivals/${festival.id}`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: nameInput.value,
            location: locationInput.value,
            startDate: startInput.value,
            endDate: endInput.value,
            inductionLink: linkInput.value || null
          })
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.message || "Update failed");
        showDismissAlert(`Updated ${nameInput.value} successfully`);
      } catch (err) {
        console.error("Update failed:", err);
        showDismissAlert("Failed to update festival.");
      }
    };

    const actionTd = document.createElement("td");
    actionTd.appendChild(saveBtn);

    const rowEl = document.createElement("tr");
    [...cells, actionTd].forEach(cell => rowEl.appendChild(cell));
    tbody.appendChild(rowEl);
  });

  table.appendChild(tbody);
  modal.appendChild(table);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.marginTop = "1rem";
  closeBtn.onclick = () => document.body.removeChild(overlay);

  modal.appendChild(closeBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

async function respond(issue) {
    // Close any existing modals
    const existing = document.getElementById("editDetailModal");
    if (existing) existing.remove();
  
    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "editDetailModal";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "5000";
  
    // Create modal box
    const modal = document.createElement("div");
    modal.style.backgroundColor = "#fff";
    modal.style.padding = "2rem";
    modal.style.borderRadius = "10px";
    modal.style.width = "420px";
    modal.style.boxShadow = "0 0 20px rgba(0,0,0,0.2)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.gap = "1rem";
  
    // Title
    const title = document.createElement("h3");
    title.textContent = `Respond to ${issue.email}`;
    modal.appendChild(title);
  
    // Message textarea
    const textarea = document.createElement("textarea");
    textarea.placeholder = "Enter your message to the user. This will be sent as an email, so be formal!";
    textarea.rows = 5;
    textarea.style.width = "95%";
    textarea.style.padding = "0.5rem";
    textarea.style.borderRadius = "5px";
    textarea.style.border = "1px solid #ccc";
    modal.appendChild(textarea);
  
    // Respond button
    const sendBtn = document.createElement("button");
    sendBtn.textContent = "Send Response & Resolve";
    sendBtn.style.padding = "0.75rem";
    sendBtn.style.backgroundColor = "#3498db";
    sendBtn.style.color = "#fff";
    sendBtn.style.border = "none";
    sendBtn.style.borderRadius = "5px";
    sendBtn.style.cursor = "pointer";
    sendBtn.style.width = "100%";
  
    sendBtn.onclick = async () => {
      const message = textarea.value.trim();
      if (!message) {
        showDismissAlert("Please enter a message before sending.");
        return;
      }
  
      try {
        const response = await fetch("/admin/sendEmail", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: issue.email,
            subject: "Response to Your Request",
            message: message
          })
        });
  
        const result = await response.json();
  
        if (!response.ok) {
          throw new Error(result.message || "Failed to send email.");
        }
  
        showDismissAlert("Response sent and issue resolved.");
        document.body.removeChild(overlay);
        await resolveIssue(issue.id);
        fetchIssues();
  
      } catch (err) {
        console.error("Error sending response:", err);
        showDismissAlert("Error: " + err.message);
      }
    };
  
    // Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.padding = "0.75rem";
    cancelBtn.style.backgroundColor = "#ccc";
    cancelBtn.style.border = "none";
    cancelBtn.style.borderRadius = "5px";
    cancelBtn.style.cursor = "pointer";
    cancelBtn.style.width = "100%";
    cancelBtn.onclick = () => document.body.removeChild(overlay);
  
    // Stack buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.flexDirection = "column";
    buttonContainer.style.gap = "0.5rem";
    buttonContainer.appendChild(sendBtn);
    buttonContainer.appendChild(cancelBtn);
  
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }
  
// Fetch open issues and display them in a table
async function fetchIssues() {
    try {
      const response = await fetch("/admin/issues", {
        method: "GET",
        headers: { "Authorization": `Bearer ${localStorage.getItem("authToken")}` }
      });
      const issues = await response.json();
      const tableBody = document.querySelector("#issuesTable tbody");
      tableBody.innerHTML = ""; // Clear existing rows
  
      issues.forEach(issue => {
        const row = document.createElement("tr");
  
        // Create cells for email, type, created date, and actions.
        const emailCell = document.createElement("td");
        emailCell.textContent = issue.email;
        const typeCell = document.createElement("td");
        typeCell.textContent = issue.type;
        const dateCell = document.createElement("td");
        dateCell.textContent = new Date(issue.createdAt).toLocaleString();
        const actionCell = document.createElement("td");
  
        // For request issues (parking_upgrade or join_request): show View Details, Accept, and Decline.
        if (issue.type === "parking_upgrade" || issue.type === "join_request") {
          // View Details button
          const viewBtn = document.createElement("button");
          viewBtn.textContent = "View Details";
          viewBtn.addEventListener("click", () => {
            viewIssueDetails(issue);
          });
  
          // Accept button
          const acceptBtn = document.createElement("button");
          acceptBtn.textContent = "Accept";
          acceptBtn.addEventListener("click", () => {
            showRequestPopup(issue, true);
          });
  
          // Decline button
          const declineBtn = document.createElement("button");
          declineBtn.textContent = "Decline";
          declineBtn.addEventListener("click", () => {
            showRequestPopup(issue, false);
          });
  
          // Create a div to hold the buttons in a row
          const buttonContainer = document.createElement("div");
          buttonContainer.style.display = "flex";
          buttonContainer.style.gap = "0.5rem";

          // Append all three buttons to the container
          buttonContainer.appendChild(viewBtn);
          acceptBtn.style.backgroundColor = "green";
          acceptBtn.style.color = "white";
          declineBtn.style.backgroundColor = "red";
          declineBtn.style.color = "white";
          buttonContainer.appendChild(acceptBtn);
          buttonContainer.appendChild(declineBtn);

          // Append the container to the action cell
          actionCell.appendChild(buttonContainer);
        }
        // For general and password_reset issues: show View Details and Resolve Issue.
        else if (issue.type === "password_reset" || issue.type === "general") {
          const viewBtn = document.createElement("button");
          viewBtn.textContent = "View Details";
          viewBtn.addEventListener("click", () => {
            viewIssueDetails(issue);
          });
  
          const resolveBtn = document.createElement("button");
          resolveBtn.textContent = issue.type === "password_reset" ? "Reset Password" : "Respond";
          resolveBtn.addEventListener("click", () => {
            if (issue.type === "password_reset") {
              resetPassword(issue);
            } else {
              respond(issue);
            }
          });
  
          const buttonContainer = document.createElement("div");
          buttonContainer.style.display = "flex";
          buttonContainer.style.gap = "0.5rem";

          buttonContainer.appendChild(viewBtn);
          resolveBtn.style.backgroundColor = "green";
          resolveBtn.style.color = "white";
          buttonContainer.appendChild(resolveBtn);

          actionCell.appendChild(buttonContainer);
        }
        // Fallback for any other issue types: just a resolve button.
        else {
          const defaultBtn = document.createElement("button");
          defaultBtn.textContent = "Resolve";
          defaultBtn.addEventListener("click", () => {
            resolveIssueWithConfirmation(issue.id);
          });
          actionCell.appendChild(defaultBtn);
        }
  
        // Append cells to the row.
        row.appendChild(emailCell);
        row.appendChild(typeCell);
        row.appendChild(dateCell);
        row.appendChild(actionCell);
        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Error fetching issues:", error);
    }
  }
  
  // Opens a modal to display issue details.
  function viewIssueDetails(issue) {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "1000";
  
    const modal = document.createElement("div");
    modal.style.backgroundColor = "#fff";
    modal.style.padding = "1.5rem";
    modal.style.borderRadius = "10px";
    modal.style.width = "400px";
    modal.style.maxWidth = "90%";
  
    const title = document.createElement("h3");
    title.textContent = "Issue Details";
  
    const content = document.createElement("div");
    content.innerHTML = `<p><strong>Email:</strong> ${issue.email}</p>
                         <p><strong>Type:</strong> ${issue.type}</p>
                         <p><strong>User Messege:</strong><br>${issue.description}</p>`;
    if (issue.user) {
    content.innerHTML += `<p><strong>User Name:</strong> ${issue.user.name || "N/A"}</p>
                    <p><strong>User Email:</strong> ${issue.user.email || "N/A"}</p>
                    <p><strong>Organisation:</strong> ${issue.user.organisation || "N/A"}</p>
                    <p><strong>Phone Number:</strong> ${issue.user.phoneNumber || "N/A"}</p>`;
    } else {
        content.innerHTML += `<p>No user with the email ${issue.email} could be found in the database.</p>`;
    }


  
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.onclick = () => document.body.removeChild(overlay);
  
    modal.appendChild(title);
    modal.appendChild(content);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }
  
  // For non-request issues: confirm then resolve the issue.
  async function resolveIssueWithConfirmation(issueId) {
    const confirmation = await showConfirmAlert("Please ensure that you have resolved this issue and notified the user.");
    if (!confirmation) return;

    try {
      const response = await fetch(`/admin/issues/resolve/${issueId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json"
        }
      });
      await response.json();
      fetchIssues(); // Refresh the table after resolution.
    } catch (error) {
      console.error("Error resolving issue:", error);
    }
  }
async function resolveIssue(issueId) {
    try {
      const response = await fetch(`/admin/issues/resolve/${issueId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json"
        }
      });
      await response.json();
      return true;
    } catch (error) {
      console.error("Error resolving issue:", error);
      return false;
    }
  }
  
  function showRequestPopup(issue, isAccept) {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "requestPopupModal";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "5000";
  
    // Modal box
    const modal = document.createElement("div");
    modal.style.backgroundColor = "#fff";
    modal.style.padding = "1.5rem";
    modal.style.borderRadius = "10px";
    modal.style.width = "90%";
    modal.style.maxWidth = "400px";
    modal.style.boxShadow = "0 0 20px rgba(0, 0, 0, 0.2)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.gap = "1rem";
  
    // Title
    const title = document.createElement("h3");
    title.textContent = isAccept ? "Accept Request" : "Decline Request";
    title.style.margin = "0";
    modal.appendChild(title);
  
    // Textarea
    const textarea = document.createElement("textarea");
    textarea.placeholder = "Leave an optional message for the user...";
    textarea.rows = 4;
    textarea.style.width = "95%";
    textarea.style.padding = "0.5rem";
    textarea.style.borderRadius = "5px";
    textarea.style.border = "1px solid #ccc";
    textarea.style.resize = "none";
    modal.appendChild(textarea);
  
    // Confirm button
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = isAccept ? "Accept Request" : "Decline Request";
    confirmBtn.style.padding = "0.75rem";
    confirmBtn.style.backgroundColor = isAccept ? "#27ae60" : "#e67e22";
    confirmBtn.style.color = "#fff";
    confirmBtn.style.border = "none";
    confirmBtn.style.borderRadius = "5px";
    confirmBtn.style.cursor = "pointer";
    confirmBtn.style.width = "100%";
  
    confirmBtn.onclick = () => {
      const note = textarea.value;
      document.body.removeChild(overlay);
      resolveIssueForRequest(issue, isAccept ? "accept" : "decline", note);
    };
  
    // Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.padding = "0.75rem";
    cancelBtn.style.backgroundColor = "#ccc";
    cancelBtn.style.border = "none";
    cancelBtn.style.borderRadius = "5px";
    cancelBtn.style.cursor = "pointer";
    cancelBtn.style.width = "100%";
  
    cancelBtn.onclick = () => document.body.removeChild(overlay);
  
    // Button container
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.flexDirection = "column";
    buttonContainer.style.gap = "0.5rem";
    buttonContainer.appendChild(confirmBtn);
    buttonContainer.appendChild(cancelBtn);
  
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }
  

  async function implementAction(issue, note) {
    // Retrieve the user UUID from the attached user object.;
    const userId = issue.user ? issue.user.userId : null;
    if (!userId) {
      console.error("User UUID not available for this issue.");
      alert("User UUID not available for this issue.");
      return false;
    }
  
    // Process based on issue type.
    try {
      if (issue.type === "join_request") {
        // For join requests, assume issue.newValue contains the festival ID (as a string).
        const festivalId = parseInt(issue.newValue, 10);
        const response = await fetch("/admin/userfestival/join-festival", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
          },
          body: JSON.stringify({
            userId: userId,
            festivalIdStr: festivalId,
            // Optionally set a parking type. Defaulting to "Standard" here.
            parkingType: "Standard",
            note: note
          })
        });
        const data = await response.json();
        if (response.ok) {
          showDismissAlert(data.message);
          return true;
        } else {
          showDismissAlert("Error: " + data.message);
          return false;
        }
      } else if (issue.type === "parking_upgrade") {
        // For parking upgrade, expect issue.newValue to hold the desired parking type
        const parsedValue = JSON.parse(issue.newValue);
        const festivalId = parseInt(parsedValue.festivalId, 10);
        const newValue = parsedValue.newValue;

        if (!festivalId) {
          console.error("Festival ID not found in the issue object.");
          showDismissAlert("Festival ID not available for this parking upgrade request.");
          return false;
        }
        const response = await fetch("/admin/userfestival/upgrade-parking", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
          },
          body: JSON.stringify({
            userId: userId,
            festivalId: festivalId,
            newParkingType: newValue,
            note: note
          })
        });
        const data = await response.json();
        if (response.ok) {
          showDismissAlert(data.message);
          return true;
        } else {
          showDismissAlert("Error: " + data.message);
          return false;
        }
      } else {
        showDismissAlert("Unsupported issue type for auto-resolution.");
        return false;
      }
    } catch (err) {
      console.error("Error implementing action:", err);
      showDismissAlert("Error processing the request action.");
      return false;
    }
  }
    
  // Resolves a request-type issue by calling the resolve endpoint with an action and note.
  async function resolveIssueForRequest(issue, action, note) {
    const confirmation = await showConfirmAlert(`Are you sure you want to ${action.toUpperCase()} this request?`);
    if (!confirmation) return;

    if (action === "accept") {
      const success = await implementAction(issue,note);
      if (!success) {
        showDismissAlert("Failed to implement the action.");
        return;
      }
    }
    
    try {
      const response = await fetch(`/admin/issues/resolve/${issue.id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: action, note: note })
      });
      await response.json();
      fetchIssues(); // Refresh the table
      if (action === "decline") {
        showDismissAlert("Request declined successfully.");
      }
    } catch (error) {
      console.error("Error resolving request issue:", error);
    }
  }

async function getUserIdByEmail(email) {
    try {
      const response = await fetch(`/admin/users/id?email=${encodeURIComponent(email)}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        }
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch user ID");
      }
  
      return data.userId;
    } catch (err) {
      console.error("Error getting user ID:", err);
      showDismissAlert(`Error: ${err.message}`);
      return null;
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

async function deleteUser(userId) {
    // Remove user edit modal if it's open
    const existing = document.getElementById("userEditModal");
    if (existing) existing.remove();
  
    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.id = "deleteUserModal";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "5000";
  
    // Create modal box
    const modal = document.createElement("div");
    modal.style.backgroundColor = "#fff";
    modal.style.padding = "2rem";
    modal.style.borderRadius = "10px";
    modal.style.width = "400px";
    modal.style.boxShadow = "0 0 20px rgba(0,0,0,0.2)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.gap = "1rem";
  
    const title = document.createElement("h3");
    title.textContent = "Delete User";
    modal.appendChild(title);
  
    const msg = document.createElement("p");
    msg.textContent = "Are you sure you want to permanently delete this user?";
    modal.appendChild(msg);
  
    // Confirm button
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Yes, Delete User";
    confirmBtn.style.backgroundColor = "#e74c3c";
    confirmBtn.style.color = "#fff";
    confirmBtn.onclick = async () => {
      const confirm = await showConfirmAlert("This action cannot be undone. Are you sure?");
      if (!confirm) return;
  
      try {
        const res = await fetch(`/admin/users/delete/${userId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
          }
        });
  
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Delete failed");
  
        showDismissAlert("User deleted successfully.");
        document.body.removeChild(overlay);
      } catch (err) {
        console.error("Error deleting user:", err);
        showDismissAlert(`Error: ${err.message}`);
      }
    };
  
    // Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => document.body.removeChild(overlay);
  
    modal.appendChild(confirmBtn);
    modal.appendChild(cancelBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }
  

async function editDetails(field, userId) {
    // Close the user modal
    const oldModal = document.getElementById("userEditModal");
    if (oldModal) oldModal.remove();
  
    // Create overlay for edit modal
    const overlay = document.createElement("div");
    overlay.id = "editDetailModal";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "5000";
  
    const modal = document.createElement("div");
    modal.style.backgroundColor = "#fff";
    modal.style.padding = "2rem";
    modal.style.borderRadius = "10px";
    modal.style.width = "400px";
    modal.style.boxShadow = "0 0 20px rgba(0,0,0,0.2)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.gap = "1rem";
  
    const title = document.createElement("h3");
    title.textContent = `Edit: ${field.label}`;
    modal.appendChild(title);
  
    let inputElement1, inputElement2, checkboxElement;
  
    if (field.type === "boolean" && Array.isArray(field.allowedValues)) {
      // Boolean: checkbox
      checkboxElement = document.createElement("input");
      checkboxElement.type = "checkbox";
      checkboxElement.checked = field.value === true;
      modal.appendChild(checkboxElement);
    } else {
      // String or Email: two input fields to confirm
      inputElement1 = document.createElement("input");
      inputElement1.type = field.type === "email" ? "email" : "text";
      inputElement1.placeholder = `Enter new ${field.label.toLowerCase()}`;
  
      inputElement2 = document.createElement("input");
      inputElement2.type = inputElement1.type;
      inputElement2.placeholder = `Confirm new ${field.label.toLowerCase()}`;
  
      modal.appendChild(inputElement1);
      modal.appendChild(inputElement2);
    }
  
    // Submit button
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Save Changes";
    confirmBtn.onclick = async () => {
      let newValue;
  
      if (field.type === "boolean") {
        newValue = checkboxElement.checked;
      } else {
        if (inputElement1.value.trim() === "" || inputElement1.value !== inputElement2.value) {
          showDismissAlert("Values must match and not be empty.");
          return;
        }
        newValue = inputElement1.value.trim();
      }
      
      try {
        const response = await fetch("/admin/users/update", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
          },
          body: JSON.stringify({
            userId: userId,
            newDetails: {
              [field.field]: newValue
            }
          })
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.message || "Failed to update user.");
        }
  
        showDismissAlert(`Successfully updated ${field.label}.`);
        document.body.removeChild(overlay);
      } catch (err) {
        console.error("Update failed:", err);
        showDismissAlert(`Error: ${err.message}`);
      }
    };
  
    // Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => {
      document.body.removeChild(overlay);
    };
  
    modal.appendChild(confirmBtn);
    modal.appendChild(cancelBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  async function changePassword(userId, email) {
    // Close modals...
    const existing = document.getElementById("editDetailModal");
    if (existing) existing.remove();
    const oldModal = document.getElementById("userEditModal");
    if (oldModal) oldModal.remove();
  
    return new Promise((resolve) => {
      // Build modal as you had before...
  
      const overlay = document.createElement("div");
      overlay.id = "editDetailModal";
        overlay.style.position = "fixed";
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
        overlay.style.display = "flex";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.zIndex = "5000";
  
      const modal = document.createElement("div");
      modal.style.backgroundColor = "#fff";
      modal.style.padding = "2rem";
      modal.style.borderRadius = "10px";
      modal.style.width = "400px";
      modal.style.boxShadow = "0 0 20px rgba(0,0,0,0.2)";
      modal.style.display = "flex";
      modal.style.flexDirection = "column";
      modal.style.gap = "1rem";

      const title = document.createElement("h3");
      title.textContent = `Change Password for ${email}`;
      modal.appendChild(title);
    
  
      const input1 = document.createElement("input");
      input1.type = "password";
      input1.placeholder = "Enter new password";
  
      const input2 = document.createElement("input");
      input2.type = "password";
      input2.placeholder = "Confirm new password";
  
      const emailCheckbox = document.createElement("input");
      emailCheckbox.type = "checkbox";
      emailCheckbox.checked = true;
  
      const emailLabel = document.createElement("label");
      emailLabel.textContent = "Email user the new password";
  
      const emailContainer = document.createElement("div");
      emailContainer.style.display = "flex";
      emailContainer.style.alignItems = "center";
      emailContainer.style.gap = "0.5rem";
      emailContainer.appendChild(emailCheckbox);
      emailContainer.appendChild(emailLabel);
  
      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save Password";
  
      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      cancelBtn.onclick = () => {
        document.body.removeChild(overlay);
        resolve(false); // Cancelled
      };
  
      saveBtn.onclick = async () => {
        const newValue1 = input1.value.trim();
        const newValue2 = input2.value.trim();
  
        if (!newValue1 || newValue1 !== newValue2) {
          showDismissAlert("Passwords must match and not be empty.");
          return;
        }
  
        const confirm = await showConfirmAlert("Are you sure you want to change this user's password?");
        if (!confirm) return;
  
        // Send email if checked
        if (emailCheckbox.checked) {
          try {
            const emailResponse = await sendEmail(
              email,
              "Password Changed",
              `Hi,\n\nYour password has been successfully updated. Your new password is: ${newValue1}.\n\nPlease keep it secure.\n\n– Tunes Festivals Team`
            );
            if (!emailResponse) throw new Error("Failed to send email.");
          } catch (err) {
            console.error("Email failed:", err);
            resolve(false);
            return;
          }
        }
  
        // Change password
        try {
          const response = await fetch("/admin/users/change-password", {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ userId, password: newValue1 })
          });
  
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || "Failed to update password.");
  
          showDismissAlert("Password updated successfully.");
          document.body.removeChild(overlay);
          resolve(true);
        } catch (err) {
          console.error("Password change failed:", err);
          showDismissAlert("Error changing password.");
          resolve(false);
        }
      };
  
      modal.appendChild(input1);
      modal.appendChild(input2);
      modal.appendChild(emailContainer);
      modal.appendChild(saveBtn);
      modal.appendChild(cancelBtn);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    });
  }
  
  async function editUserFestival(festival, userId) {
    // Close any open modals
    // Close any other modals
    const existing = document.getElementById("editDetailModal");
    if (existing) existing.remove();

    const oldModal = document.getElementById("userEditModal");
    if (oldModal) oldModal.remove();
  
    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "editDetailModal";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "5000";
  
    // Modal container
    const modal = document.createElement("div");
    modal.style.backgroundColor = "#fff";
    modal.style.padding = "2rem";
    modal.style.borderRadius = "10px";
    modal.style.width = "400px";
    modal.style.boxShadow = "0 0 20px rgba(0,0,0,0.2)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.gap = "1rem";
  
    const title = document.createElement("h3");
    title.textContent = `Update Parking for ${festival.festivalName}`;
    modal.appendChild(title);
  
    // Dropdown for parking type
    const select = document.createElement("select");
    festival.allowedValues.forEach(type => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      if (type === festival.parkingType) option.selected = true;
      select.appendChild(option);
    });
    modal.appendChild(select);
  
    // Optional note field
    const noteBox = document.createElement("textarea");
    noteBox.placeholder = "Add a note (optional)";
    noteBox.rows = 3;
    modal.appendChild(noteBox);
  
    // Save button
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save Parking Type";
    saveBtn.onclick = async () => {
      const newParkingType = select.value;
      const note = noteBox.value;
  
      if (newParkingType === festival.parkingType) {
        showDismissAlert("Parking type has not changed.");
        return;
      }
  
      const confirm = await showConfirmAlert(`Change parking to ${newParkingType}?`);
      if (!confirm) return;
  
      try {
        const response = await fetch("/admin/userfestival/upgrade-parking", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
          },
          body: JSON.stringify({
            userId: userId,
            festivalId: festival.festivalId,
            newParkingType: newParkingType,
            note: note
          })
        });
  
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to update parking");
  
        showDismissAlert("Parking type updated successfully.");
        document.body.removeChild(overlay);
      } catch (err) {
        console.error("Error updating parking:", err);
        showDismissAlert(`Error: ${err.message}`);
      }
    };
  
    // Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => document.body.removeChild(overlay);
  
    modal.appendChild(saveBtn);
    modal.appendChild(cancelBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }
  
async function addFestivalAffiliation(festivals, userId) {
    // Close any open modals
    const existing = document.getElementById("editDetailModal");
    if (existing) existing.remove();

    const oldModal = document.getElementById("userEditModal");
    if (oldModal) oldModal.remove();
  
    // Step 1: Fetch all festivals
    let allFestivals = [];
    try {
      const res = await fetch("/festivals", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch festivals");
      allFestivals = await res.json();
    } catch (err) {
      console.error("Error fetching festivals:", err);
      showDismissAlert("Error loading festivals.");
      return;
    }
  
    // Step 2: Filter out already affiliated festivals
    const affiliatedIds = festivals.affiliations.map(f => f.festivalId);
    const availableFestivals = allFestivals.filter(f => !affiliatedIds.includes(f.id));
  
    if (availableFestivals.length === 0) {
      showDismissAlert("User is already affiliated with all festivals.");
      return;
    }
  
    // Step 3: Create modal
    const overlay = document.createElement("div");
    overlay.id = "editDetailModal";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "5000";
  
    const modal = document.createElement("div");
    modal.style.backgroundColor = "#fff";
    modal.style.padding = "2rem";
    modal.style.borderRadius = "10px";
    modal.style.width = "400px";
    modal.style.boxShadow = "0 0 20px rgba(0,0,0,0.2)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.gap = "1rem";
  
    const title = document.createElement("h3");
    title.textContent = "Add Festival Affiliation";
    modal.appendChild(title);
  
    // Festival dropdown
    const festivalSelect = document.createElement("select");
    availableFestivals.forEach(f => {
      const option = document.createElement("option");
      option.value = f.id;
      option.textContent = `${f.name} (${f.location})`;
      festivalSelect.appendChild(option);
    });
    modal.appendChild(festivalSelect);
  
    // Parking type dropdown
    const parkingSelect = document.createElement("select");
    const parkingOptions = ["AAA", "Standard", "Staff", "VIP", "Trader", "Camping"];
    parkingOptions.forEach(p => {
      const option = document.createElement("option");
      option.value = p;
      option.textContent = p;
      parkingSelect.appendChild(option);
    });
    modal.appendChild(parkingSelect);
  
    // Optional note
    const noteBox = document.createElement("textarea");
    noteBox.placeholder = "Add a note (optional)";
    noteBox.rows = 3;
    modal.appendChild(noteBox);
  
    // Submit button
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Add Affiliation";
    confirmBtn.onclick = async () => {
      const selectedFestivalId = festivalSelect.value;
      const selectedParking = parkingSelect.value;
      const note = noteBox.value;
  
      const confirm = await showConfirmAlert(`Add user to ${festivalSelect.options[festivalSelect.selectedIndex].text}?`);
      if (!confirm) return;
  
      try {
        const res = await fetch("/admin/userfestival/join-festival", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
          },
          body: JSON.stringify({
            userId,
            festivalIdStr: selectedFestivalId,
            parkingType: selectedParking,
            note
          })
        });
  
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Failed to add affiliation");
  
        showDismissAlert("Festival affiliation added successfully.");
        document.body.removeChild(overlay);
      } catch (err) {
        console.error("Add affiliation failed:", err);
        showDismissAlert(`Error: ${err.message}`);
      }
    };
  
    // Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => document.body.removeChild(overlay);
  
    modal.appendChild(confirmBtn);
    modal.appendChild(cancelBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

async function removeUserFestival(festivalId, userId) {

    // Close any open modals
    const existing = document.getElementById("editDetailModal");
    if (existing) existing.remove();

    const oldModal = document.getElementById("userEditModal");
    if (oldModal) oldModal.remove();

    const confirm = await showConfirmAlert("Are you sure you want to remove this festival affiliation?");
    if (!confirm) return;
  
    try {
      const response = await fetch("/admin/userfestival/remove", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify({ userId, festivalId })
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.message || "Failed to remove affiliation");
      }
  
      showDismissAlert("Festival affiliation removed successfully.");
      // Optional: Refresh modal or UI here
    } catch (error) {
      console.error("Error removing user festival:", error);
      showDismissAlert(`Error: ${error.message}`);
    }
  }
  
  

async function showUserModal(user, festivals) {

    const userEmailField = user.fields.find(f => f.field === "email");
    const userId = await getUserIdByEmail(userEmailField.value);
    const userEmail = userEmailField.value;

    // Remove existing modal if any
    const existing = document.getElementById("userEditModal");
    if (existing) existing.remove();
  
    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "userEditModal";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "10000";
  
    // Create modal box
    const modal = document.createElement("div");
    modal.style.backgroundColor = "#fff";
    modal.style.padding = "2rem";
    modal.style.borderRadius = "10px";
    modal.style.width = "800px";
    modal.style.maxHeight = "90vh";
    modal.style.overflowY = "auto";
    modal.style.boxShadow = "0 0 20px rgba(0,0,0,0.2)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.gap = "2rem";
  
    // ---------- USER DETAILS TABLE ----------
    const userSection = document.createElement("div");
    const userTitle = document.createElement("h3");
    userTitle.textContent = "User Details";
    userSection.appendChild(userTitle);
  
    const userTable = document.createElement("table");
    userTable.className = "clean-table";
    const userTbody = document.createElement("tbody");
  
    user.fields.forEach(field => {
      const row = document.createElement("tr");
  
      const nameTd = document.createElement("td");
      nameTd.textContent = field.label;
  
      const valueTd = document.createElement("td");
      valueTd.textContent = field.value;
  
      const editTd = document.createElement("td");
      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.onclick = () => editDetails(field,userId);
      editTd.appendChild(editBtn);
  
      row.appendChild(nameTd);
      row.appendChild(valueTd);
      row.appendChild(editTd);
      userTbody.appendChild(row);
    });
  
    userTable.appendChild(userTbody);
    userSection.appendChild(userTable);
  
    // Action buttons
    const actionsDiv = document.createElement("div");
    actionsDiv.style.display = "flex";
    actionsDiv.style.gap = "1rem";
    actionsDiv.style.marginTop = "1rem";
  
    const changePasswordBtn = document.createElement("button");
    changePasswordBtn.textContent = "Change Password";
    changePasswordBtn.onclick = () => changePassword(userId,userEmail);
  
    const deleteUserBtn = document.createElement("button");
    deleteUserBtn.textContent = "Delete User";
    deleteUserBtn.style.backgroundColor = "#e74c3c";
    deleteUserBtn.style.color = "white";
    deleteUserBtn.onclick = () => deleteUser(userId);
  
    actionsDiv.appendChild(changePasswordBtn);
    actionsDiv.appendChild(deleteUserBtn);
    userSection.appendChild(actionsDiv);
  
    // ---------- FESTIVAL AFFILIATIONS TABLE ----------
    const festSection = document.createElement("div");
    const festTitle = document.createElement("h3");
    festTitle.textContent = "Festival Affiliations";
    festSection.appendChild(festTitle);
  
    const festTable = document.createElement("table");
    festTable.className = "clean-table";
    const festTbody = document.createElement("tbody");
  
    festivals.affiliations.forEach(festival => {
      const row = document.createElement("tr");
  
      const nameTd = document.createElement("td");
      nameTd.textContent = festival.festivalName;
  
      const parkingTd = document.createElement("td");
      parkingTd.textContent = festival.parkingType;
  
      const editTd = document.createElement("td");
      const removeTd = document.createElement("td");
      const editBtn = document.createElement("button");
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove";
      removeBtn.style.backgroundColor = "#e74c3c";
      removeBtn.style.color = "white";
      editBtn.textContent = "Edit";
      editBtn.onclick = () => editUserFestival(festival, userId);
      removeBtn.onclick = async () => removeUserFestival(festival.festivalId, userId);
      editTd.appendChild(editBtn);
      removeTd.appendChild(removeBtn);
  
      row.appendChild(nameTd);
      row.appendChild(parkingTd);
      row.appendChild(editTd);
      row.appendChild(removeTd);
      festTbody.appendChild(row);
    });
  
    festTable.appendChild(festTbody);
    festSection.appendChild(festTable);
  
    // Add Festival button
    const addFestivalBtn = document.createElement("button");
    addFestivalBtn.textContent = "Add Festival Affiliation";
    console.log(festivals);
    addFestivalBtn.onclick = () => addFestivalAffiliation(festivals, userId);
    festSection.appendChild(addFestivalBtn);
  
    // ---------- CLOSE BUTTON ----------
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.style.marginTop = "1rem";
    closeBtn.onclick = () => document.body.removeChild(overlay);
  
    // ---------- ASSEMBLE ----------
    modal.appendChild(userSection);
    modal.appendChild(festSection);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
  

async function ShowEditUser(userId) {
    let userResponse, userFestivalsResponse;
    let userData = null, userFestivalsData = null;
  
    try {
      userResponse = await fetch(`/admin/users/details/${userId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json"
        }
      });
      if (!userResponse.ok) {
        const err = await userResponse.json();
        throw new Error(err.message || "Failed to fetch user details");
      }
      userData = await userResponse.json();
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  
    try {
      userFestivalsResponse = await fetch(`/admin/users/festivals/${userId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json"
        }
      });
      if (!userFestivalsResponse.ok) {
        const err = await userFestivalsResponse.json();
        throw new Error(err.message || "Failed to fetch user festivals");
      }
      userFestivalsData = await userFestivalsResponse.json();
    } catch (error) {
      console.error("Error fetching user festivals:", error);
    }
  
    // Only call showUserModal if both fetches were successful.
    if (userResponse && userResponse.ok && userFestivalsResponse && userFestivalsResponse.ok) {
      showUserModal(userData, userFestivalsData);
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
        const tableBody = document.getElementById("siteLogsTableBody");
        const tableHead = document.getElementById("siteLogsTableHead");

        tableHead.innerHTML = `
            <tr>
                <th>Name</th>
                <th>Organisation</th>
                <th>Phone Number</th>
                <th>Email</th>
            </tr>
        `;

        tableBody.innerHTML = ""; // Clear previous data


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
                document.getElementById("currentAlert").textContent = result.level + ": " + result.message;
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
            const response = await fetch(`/user`, {
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

    document.getElementById("fetch-all-issues-button").addEventListener("click", fetchIssues);
    document.getElementById("fetch-recent-logs").addEventListener("click", fetchLogs);
    document.getElementById("download-logs").addEventListener("click", downloadLogs);
    document.getElementById("get-site-log").addEventListener("click", fetchSignins);
    document.getElementById("download-signedin").addEventListener("click", downloadSignedInUsers);
    document.getElementById("display-signed-in-users").addEventListener("click", fetchSignedInUsers);

    document.getElementById("logout").addEventListener("click", () => {
        localStorage.removeItem("authToken");
        window.location.href = "index.html";
    });

    // Fetch initial data
    fetchAdminDetails();
    fetchQRCode();
    fetchAlert();
    fetchUserStats();
    loadUserFestivals("festivalList");

    // Toggle navigation menu
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });

    document.getElementById("showFestivals").addEventListener("click", () => {
      showFestivalAdminModal();
    });

    
    // Search users
    document.getElementById("searchInput").addEventListener("input", async function() {
        const query = this.value;
      
        // If query is empty, clear the table.
        if (!query.trim()) {
          document.getElementById("usersTableBody").innerHTML = "";
          return;
        }
      
        try {
          const response = await fetch(`/admin/users/search?query=${encodeURIComponent(query)}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("authToken")}`
            }
          });
          const users = await response.json();
          
          // Clear the table body.
          const tbody = document.getElementById("usersTableBody");
          tbody.innerHTML = "";
      
          users.forEach(user => {
            const tr = document.createElement("tr");
      
            // Name cell.
            const nameTd = document.createElement("td");
            nameTd.textContent = user.name || "";
            tr.appendChild(nameTd);
      
            // Email cell.
            const emailTd = document.createElement("td");
            emailTd.textContent = user.email || "";
            tr.appendChild(emailTd);
      
            // Organisation cell.
            const orgTd = document.createElement("td");
            orgTd.textContent = user.organisation || "";
            tr.appendChild(orgTd);
      
            // Actions cell with an Edit button.
            const actionTd = document.createElement("td");
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", () => {
              ShowEditUser(user.userId); 
            });
            actionTd.appendChild(editBtn);
            tr.appendChild(actionTd);
      
            tbody.appendChild(tr);
          });
        } catch (err) {
          console.error("Error fetching users:", err);
        }
      });
      
});



  




