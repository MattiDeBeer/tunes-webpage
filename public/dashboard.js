const apiUrl = window.location.origin;

// Loads and displays the user's associated festivals
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
        container.innerHTML = "<p>No associated festivals found. If this is a new account, you must request to be added to a festival using the button below.</p>";
        return;
      }
  
      // Wrapper for scroll + sticky headers
      const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";
    wrapper.style.maxHeight = "300px";
  
      const table = document.createElement("table");
      table.className = "clean-table";
  
      // Table header
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      ["Festival Name", "Current Parking", "Request Change"].forEach(text => {
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
        const currentType = festival.UserFestival?.parkingType || "Standard";
        parkingCell.textContent = currentType;
  
        const actionCell = document.createElement("td");
  
        const select = document.createElement("select");
        ["Standard", "Staff", "VIP", "Trader", "Camping", "AAA"].forEach(type => {
          const option = document.createElement("option");
          option.value = type;
          option.textContent = type;
          if (type === currentType) option.selected = true;
          select.appendChild(option);
        });
  
        const button = document.createElement("button");
        button.textContent = "Request Change";
        button.onclick = () => {
          if (document.getElementById("parking-note-popup")) return;
  
          const popupOverlay = document.createElement("div");
          popupOverlay.id = "parking-note-popup";
          popupOverlay.style.position = "fixed";
          popupOverlay.style.top = 0;
          popupOverlay.style.left = 0;
          popupOverlay.style.width = "100vw";
          popupOverlay.style.height = "100vh";
          popupOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
          popupOverlay.style.display = "flex";
          popupOverlay.style.alignItems = "center";
          popupOverlay.style.justifyContent = "center";
          popupOverlay.style.zIndex = "5000";
  
          const popupBox = document.createElement("div");
          popupBox.style.backgroundColor = "#fff";
          popupBox.style.padding = "1.5rem";
          popupBox.style.borderRadius = "10px";
          popupBox.style.width = "400px";
          popupBox.style.maxWidth = "95%";
          popupBox.style.boxShadow = "0 0 15px rgba(0,0,0,0.2)";
          popupBox.style.display = "flex";
          popupBox.style.flexDirection = "column";
          popupBox.style.gap = "1rem";
  
          const title = document.createElement("h3");
          title.textContent = `You have requested to change your parking type to ${select.value}`;
  
          const textarea = document.createElement("textarea");
          textarea.placeholder = "Please add a reason for this change";
          textarea.rows = 4;
          textarea.style.width = "100%";
          textarea.style.resize = "none";
  
          const confirmButton = document.createElement("button");
          confirmButton.textContent = "Confirm Update";
          confirmButton.style.padding = "0.5rem 1rem";
  
          const cancelButton = document.createElement("button");
          cancelButton.textContent = "Cancel";
          cancelButton.style.padding = "0.5rem 1rem";
          cancelButton.style.backgroundColor = "#f44336";
  
          confirmButton.onclick = async () => {
            const newType = select.value;
            const note = textarea.value;
  
            try {
              const response = await fetch("/user/festivals/parking/request", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                  festivalId: festival.id,
                  newParkingType: newType,
                  note: note
                })
              });
  
              const result = await response.json();
              parkingCell.textContent = result.parkingType;
  
              document.body.removeChild(popupOverlay);
              showAlert("Request submitted successfully!");
            } catch (err) {
              console.error("Error updating parking type:", err);
              showAlert("Failed to update parking type.");
              document.body.removeChild(popupOverlay);
            }
          };
  
          cancelButton.onclick = () => document.body.removeChild(popupOverlay);
  
          popupBox.appendChild(title);
          popupBox.appendChild(textarea);
          popupBox.appendChild(confirmButton);
          popupBox.appendChild(cancelButton);
          popupOverlay.appendChild(popupBox);
          document.body.appendChild(popupOverlay);
        };
  
        const actionWrapper = document.createElement("div");
        actionWrapper.className = "flex-inline";
        actionWrapper.appendChild(select);
        actionWrapper.appendChild(button);
  
        actionCell.appendChild(actionWrapper);
  
        row.appendChild(nameCell);
        row.appendChild(parkingCell);
        row.appendChild(actionCell);
  
        tbody.appendChild(row);
      });
  
      table.appendChild(tbody);
      wrapper.appendChild(table);
      container.innerHTML = ""; // Clear any previous content
      container.appendChild(wrapper);
  
    } catch (err) {
      console.error("Error loading festivals:", err);
      container.innerHTML = "<p>Error loading festivals.</p>";
    }
  }
  

async function openJoinFestivalModal(existingFestivalIds = []) {
    const token = localStorage.getItem("authToken");

    const allRes = await fetch("/festivals", {
        headers: { Authorization: `Bearer ${token}` }
    });
    const allFestivals = await allRes.json();

    const availableFestivals = allFestivals.filter(f => !existingFestivalIds.includes(f.id));

    if (availableFestivals.length === 0) {
        showAlert("You're already part of all available festivals.");
        return;
    }

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = 9999;
    overlay.style.padding = "1rem";

    const modal = document.createElement("div");
    modal.style.backgroundColor = "#fff";
    modal.style.borderRadius = "10px";
    modal.style.padding = "1.5rem";
    modal.style.width = "100%";
    modal.style.maxWidth = "400px";
    modal.style.boxSizing = "border-box";
    modal.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.gap = "1rem";

    const title = document.createElement("h3");
    title.textContent = "Request to Join a Festival";

    const festivalSelect = document.createElement("select");
    festivalSelect.style.padding = "0.5rem";

    availableFestivals.forEach(f => {
        const option = document.createElement("option");
        option.value = f.id;
        option.textContent = `${f.name} (${f.location})`;
        festivalSelect.appendChild(option);
    });

    const noteInput = document.createElement("textarea");
    noteInput.placeholder = "Optional note...";
    noteInput.rows = 3;

    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Submit Request";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.backgroundColor = "#f44336";

    confirmBtn.onclick = async () => {
        const selectedId = festivalSelect.value;
        const note = noteInput.value;

        try {
            const response = await fetch("/user/festivals/request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    festivalId: selectedId,
                    note: note
                })
            });

            if (!response.ok) throw new Error("Request failed.");
            showAlert("Request submitted successfully!");
            document.body.removeChild(overlay);
        } catch (err) {
            console.error(err);
            showAlert("Failed to submit request.");
        }
    };

    cancelBtn.onclick = () => {
        document.body.removeChild(overlay);
    };

    modal.appendChild(title);
    modal.appendChild(festivalSelect);
    modal.appendChild(noteInput);
    modal.appendChild(confirmBtn);
    modal.appendChild(cancelBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}




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
async function showAlert(message) {
    const termsTextElement = document.getElementById("terms-text");
    if (message) {
        termsTextElement.innerHTML = `<h1>${message}</h1>`;
    }
    const modal = document.getElementById("termsModal");
    const dismissBtn = document.getElementById("dismissButton");

    // Ensure modal appears above all others
    modal.style.zIndex = "9999";

    // Show modal and configure buttons
    modal.style.display = "block";
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
            dismissBtn.style.display = "none";
            dismissBtn.removeEventListener("click", handleDismiss);
        };

        // Add listener
        dismissBtn.addEventListener("click", handleDismiss);
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
            showAlert(result.level + ": " + result.message);
        } else {
            console.log(result.message);
        }
    } catch (error) {
        console.error("Error fetching alert:", error);
    }
}

function showUserSelfEditModal() {

    if (!window.LoadedUserDetails.fields) {
        window.LoadedUserDetails = {
          fields: Object.entries(window.LoadedUserDetails).map(([key, value]) => ({
            field: key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: value,
            type: typeof value === "boolean" ? "boolean" : "string"
          }))
        };
      }
      

    const user = window.LoadedUserDetails;
    console.log(user)

    if (!user || !Array.isArray(user.fields)) {
      showAlert("No user details available.");
      return;
    }
  
    const existing = document.getElementById("editDetailModal");
    if (existing) existing.remove();
  
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
    modal.style.width = "420px";
    modal.style.maxHeight = "90vh";
    modal.style.overflowY = "auto";
    modal.style.boxShadow = "0 0 20px rgba(0,0,0,0.2)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.gap = "1rem";
  
    const title = document.createElement("h3");
    title.textContent = "Edit Your Account Details";
    modal.appendChild(title);
  
    const table = document.createElement("table");
    table.className = "clean-table";
  
    const tbody = document.createElement("tbody");
  
    user.fields.forEach(field => {
    if (["userId", "updatedAt", "createdAt", "isAdmin", "agreedToTerms"].includes(field.field)) return; // don't show these fields
  
      const row = document.createElement("tr");
  
      const labelCell = document.createElement("td");
      labelCell.textContent = field.label.replace(/([a-z])([A-Z])/g, '$1 $2').replace('isSignedIn', 'is signed').replace('phoneNumber', 'phone number');
  
      const valueCell = document.createElement("td");
      valueCell.textContent = field.type === "boolean"
        ? (field.value ? "Yes" : "No")
        : field.value;
  
      const actionCell = document.createElement("td");
      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.onclick = () => openEditFieldModal(field);
      actionCell.appendChild(editBtn);
  
      row.appendChild(labelCell);
      row.appendChild(valueCell);
      row.appendChild(actionCell);
      tbody.appendChild(row);
    });
  
    table.appendChild(tbody);
    modal.appendChild(table);
  
    const changePasswordBtn = document.createElement("button");
    changePasswordBtn.textContent = "Change Password";
    changePasswordBtn.onclick = () => openEditFieldModal({ field: "password", label: "Password", type: "string", value: "" });
    modal.appendChild(changePasswordBtn);

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.onclick = () => document.body.removeChild(overlay);
    modal.appendChild(closeBtn);
  
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  function openEditFieldModal(field) {
    const existing = document.getElementById("fieldEditModal");
    if (existing) existing.remove();
  
    const overlay = document.createElement("div");
    overlay.id = "fieldEditModal";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "5100";
  
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
    title.textContent = `Edit ${field.label}`;
    modal.appendChild(title);
  
    let input1, input2, toggle;
  
    if (field.type === "boolean") {
      toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.checked = field.value === true;
      modal.appendChild(toggle);
    } else {
      input1 = document.createElement("input");
      input1.type = field.type === "email" ? "email" : (field.field === "password" ? "password" : "text");
      input1.placeholder = "Enter new value";
      modal.appendChild(input1);
  
      input2 = document.createElement("input");
      input2.type = input1.type;
      input2.placeholder = "Confirm new value";
      modal.appendChild(input2);
    }
  
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.onclick = async () => {
      const token = localStorage.getItem("authToken");
      let newValue1, newValue2;
  
      if (field.type === "boolean") {
        newValue1 = toggle.checked;
        newValue2 = toggle.checked;
      } else {
        newValue1 = input1.value.trim();
        newValue2 = input2.value.trim();
        if (!newValue1 || newValue1 !== newValue2) {
          showAlert("Values must match and not be empty.");
          return;
        }
      }
  
      try {
        const res = await fetch("/user/updateUser", {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            field: field.field,
            newValue1,
            newValue2
          })
        });
  
        const result = await res.json();
  
        if (!res.ok) throw new Error(result.message || "Failed to update.");
  
        showAlert("Field updated successfully.");
        document.body.removeChild(overlay);
        document.body.removeChild(document.getElementById("editDetailModal"));
        await loadUserDetails(window.UUID); // refresh data
      } catch (err) {
        console.error("Error updating field:", err);
        showAlert("Error: " + err.message);
      }
    };
  
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => document.body.removeChild(overlay);
  
    modal.appendChild(saveBtn);
    modal.appendChild(cancelBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
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

        window.LoadedUserDetails = user;

        const signedInElement = document.getElementById("SignedInTxt");
        signedInElement.textContent = user.isSignedIn ? "You are signed into the Festival Site" : "You are not signed into the Festival Site";
        signedInElement.style.color = user.isSignedIn ? "green" : "red";

        const emailElement = document.getElementById("email");
        emailElement.textContent = user.email;

        const organisationElement = document.getElementById("organisation");
        organisationElement.textContent = user.organisation || "No organisation specified";

        const nameElement = document.getElementById("name");
        nameElement.textContent = user.name.split(' ')[0] || "No name found";

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

// Event listener for DOM content loaded
document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    await loadUserDetails();

    
    document.getElementById("logout").addEventListener("click", () => {
        localStorage.removeItem("authToken");
        window.location.href = "index.html";
    });

    document.getElementById("settings").addEventListener("click", () => {
        showUserSelfEditModal();
      });
      
    fetchQRCode();
    fetchAlert();
    loadUserFestivals("festivalList");

    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });

    const requestButton = document.getElementById("requestJoinBtn");
    requestButton.addEventListener("click", async () => {
        const token = localStorage.getItem("authToken");

        const userFestivalsRes = await fetch("/user/festivals", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const userFestivals = await userFestivalsRes.json();
        const joinedIds = userFestivals.map(f => f.id);

        openJoinFestivalModal(joinedIds);
    });

});
