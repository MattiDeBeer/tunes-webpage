const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const QRCode = require("qrcode");
const crypto = require("crypto");
const { get } = require('http');
const https = require("https");
const { v4: uuidv4 } = require('uuid');
const util = require('util');
const { User } = require('../models/database'); // Import User model from your database.js
const { Issue } = require("../models/database"); // Import the Issue model
const { Alert } = require("../models/database"); // Import the Alert model
const { Parser } = require("json2csv");

require('dotenv').config();

// Initialize the app
const app = express();

// Set CSP headers
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; " +
        "img-src 'self' data: blob:; " + // Allow images from 'self', data URLs, and blob URLs
        "style-src 'self' 'unsafe-inline'; " + // Allow inline styles (if you must)
        "script-src 'self' https://unpkg.com;" // Allow scripts from 'self' and 'unpkg.com'
    );
    next();
});

// Ensure the ../data directory exists
const logDirectory = path.join(__dirname, '..', 'data');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory); // Create the directory if it doesn't exist
}

// Create a write stream for the log file in the ../data directory
const logFile = fs.createWriteStream(path.join(logDirectory, 'server.log'), { flags: 'a' });
const signInLogFile = fs.createWriteStream(path.join(logDirectory, 'siteLog.log'), { flags: 'a' });

// Middleware to serve static files
app.use(express.static(path.join(__dirname, '../public'))); // Serve files from the 'public' folder

// Middleware to parse JSON
app.use(express.json());  // For parsing application/json


// Function to check if an email is valid
function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
}

// Function to check if a phone number is valid
function isValidPhone(phone) {
        const phoneRegex = /^\+?\d{10,15}$/; // Allows optional '+' and 10-15 digits
        return phoneRegex.test(phone);
}

async function hashPassword(password) {
        const saltRounds = 10; // You can change this to any number, but 10 is a good default
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
}

function isAdmin(token) {
        try {
                const decoded = jwt.verify(token, secretKey);
                const users = getUsers();
                const user = users.find(u => u.email === decoded.email);
                return true;
        } catch (err) {
                return false;
        }
}

// POST route for login (Refactored to use Sequelize)
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        console.log('Login attempt failed: Missing email or password');
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Fetch user from the database
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            console.log(`Login attempt failed: Invalid email - ${email}`);
            return res.status(400).json({ message: `Invalid email: ${email}` });
        }

        // Compare password with hashed password stored in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`Login attempt failed: Invalid password for email - ${email}`);
            return res.status(400).json({ message: "Invalid password" });
        }

        // Generate JWT Token with the user ID
        const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });

        console.log(`Login successful for email - ${email}`);
        if (user.isAdmin) {
            return res.json({ token: token, redirectUrl: '/admin-dashboard.html' });
        } else {
            return res.json({ token: token, redirectUrl: '/dashboard.html' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// General User Authentication Middleware (refactored to use Sequelize)
const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1]; // Assumes Bearer token

    if (!token) {
        console.log('Authentication failed: No token provided');
        return res.status(403).json({ message: "Access denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.userId = decoded.userId; // Store userId in request object
        console.log(`Authentication successful: User ID ${req.userId}`);
        next();
    } catch (err) {
        console.log('Authentication failed: Invalid token');
        return res.status(400).json({ message: "Invalid token" });
    }
};

// Admin Authentication Middleware (refactored to use Sequelize)
const authenticateAdminToken = async (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1]; // Assumes Bearer token

    if (!token) {
        console.log('Admin authentication failed: No token provided');
        return res.status(403).json({ message: "Access denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.userId = decoded.userId; // Store userId in request object

        // Check if the user is an admin
        const user = await User.findByPk(req.userId);
        if (user && user.isAdmin) {
            console.log(`Admin authentication successful: User ID ${req.userId}`);
            next(); // Proceed if the user is an admin
        } else {
            console.log(`Admin authentication failed: User ID ${req.userId} does not have admin privileges`);
            return res.status(403).json({ message: "Admin privileges required" });
        }
    } catch (err) {
        console.log('Admin authentication failed: Invalid token');
        return res.status(400).json({ message: "Invalid token" });
    }
};

// Protected route to fetch user details (refactored to use Sequelize)
app.get("/user", authenticateToken, async (req, res) => {
    try {
        // Fetch user data from the database using the userId decoded from the JWT
        const user = await User.findByPk(req.userId);

        if (!user) {
            console.log(`User fetch failed: User ID ${req.userId} not found`);
            return res.status(404).json({ message: "User not found" });
        }

        // Return user data, excluding the password
        const { password, ...userData } = user.toJSON();
        console.log(`User fetch successful: User ID ${req.userId}`);
        res.json(userData);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: "Error fetching user details" });
    }
});

// Protected route to fetch user details (using email as a query parameter)
app.get("/admin/getUser", authenticateAdminToken, async (req, res) => {
    const { email } = req.query; // Get email from query parameters

    if (!email) {
        console.log('Fetch user details failed: Email parameter is required');
        return res.status(400).json({ message: "Email parameter is required" });
    }

    try {
        // Fetch user data from the database using the provided email
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log(`Fetch user details failed: User not found for email - ${email}`);
            return res.status(404).json({ message: "User not found" });
        }

        // Return user data, excluding the password
        const { password, ...userData } = user.toJSON();
        console.log(`Fetch user details successful: User found for email - ${email}`);
        res.json(userData);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: "Error fetching user details" });
    }
});


// Signup endpoint (refactored to use Sequelize)
app.post("/signup", async (req, res) => {
    const { name, password, repeatPassword, email, organisation, phoneNumber } = req.body;

    // Check if all required fields are provided
    if (!name || !password || !repeatPassword || !email || !organisation || !phoneNumber) {
        console.log('Signup attempt failed: Missing required fields');
        return res.status(400).json({ message: "All fields are required" });
    }

    // Check if passwords match
    if (password !== repeatPassword) {
        console.log('Signup attempt failed: Passwords do not match');
        return res.status(400).json({ message: "Passwords do not match" });
    }

    // Validate email format
    if (!isValidEmail(email)) {
        console.log(`Signup attempt failed: Invalid email format - ${email}`);
        return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate phone number format
    if (!isValidPhone(phoneNumber)) {
        console.log(`Signup attempt failed: Invalid phone number format - ${phoneNumber}`);
        return res.status(400).json({ message: "Invalid phone number format" });
    }

    // Check if the email already exists in the database
    const existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
        console.log(`Signup attempt failed: Email already exists - ${email}`);
        return res.status(400).json({ message: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate UUID for the new user
    const userUUID = uuidv4(); // This generates a unique user ID (UUID v4)

    // Generate QR Code
    const qrCodeDir = path.join(__dirname, '../data/qr-codes');
    if (!fs.existsSync(qrCodeDir)) {
        fs.mkdirSync(qrCodeDir, { recursive: true });
    }

    // Save the QR code as {UUID}.png
    const qrCodePath = path.join(qrCodeDir, `${userUUID}.png`);
    const qrCodeData = `${userUUID}`; // You can encode more data if needed

    // Generate the QR code and save it
    await QRCode.toFile(qrCodePath, qrCodeData, { width: 500, height: 500 });

    // Create the new user record in the database
    try {
        const newUser = await User.create({
            userId: userUUID, // Store UUID as user ID
            name: name,
            password: hashedPassword,
            email: email,  // Store the original email (or you could store hashed email if preferred)
            organisation: organisation,
            phoneNumber: phoneNumber,
            isAdmin: false,
            isSignedIn: false,
        });

        console.log(`Signup successful: User created with email - ${email}`);
        res.json({ message: "Account created successfully!" });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: "Error creating user" });
    }
});


// Route to fetch the QR code for the authenticated user (refactored to use Sequelize)
app.get("/user/qr", authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);

        if (!user) {
            console.log(`QR code fetch failed: User ID ${req.userId} not found`);
            return res.status(404).json({ message: "User not found" });
        }

        const qrCodePath = path.join(__dirname, `../data/qr-codes/${user.userId}.png`);

        if (!fs.existsSync(qrCodePath)) {
            console.log(`QR code fetch failed: QR code not found for User ID ${req.userId}`);
            return res.status(404).json({ message: "QR code not found" });
        }

        console.log(`QR code fetch successful: User ID ${req.userId}`);
        res.sendFile(qrCodePath);

    } catch (error) {
        console.error(`Error fetching QR code for User ID ${req.userId}:`, error);
        res.status(500).json({ message: "Error fetching QR code" });
    }
});
// The route to update user data (refactored to use Sequelize)
app.patch("/user/updateUser", authenticateToken, async (req, res) => {
    const { field, newValue1, newValue2 } = req.body;

    if (newValue1 !== newValue2) {
        console.log(`User update failed: New values do not match for User ID ${req.userId}`);
        return res.status(400).json({ message: "New values do not match" });
    }

    const validFields = ["name", "email", "organisation", "phoneNumber", "password", "isSignedIn"];

    if (!validFields.includes(field)) {
        console.log(`User update failed: Invalid field ${field} for User ID ${req.userId}`);
        return res.status(400).json({ message: "Invalid field to update" });
    }

    let newValue = newValue1;
    if (field === "password") {
        newValue = await hashPassword(newValue1);
    }

    try {
        const user = await User.findOne({ where: { userId: req.userId } });

        if (!user) {
            console.log(`User update failed: User ID ${req.userId} not found`);
            return res.status(404).json({ message: "User not found" });
        }

        user[field] = newValue;
        await user.save();

        if (field === "isSignedIn") {
            if (newValue) {
                signInLogFile.write(`[${new Date().toISOString()}] ${user.name} (${user.organisation}) Signed in to the site \n` )
            } else {
                signInLogFile.write(`[${new Date().toISOString()}] ${user.name} (${user.organisation}) Signed out of the site \n` )
            }
        }

        console.log(`User update successful: User ID ${req.userId}, Field ${field}`);
        res.json({ message: "User updated successfully", updatedUser: { [field]: newValue } });
    } catch (error) {
        console.error(`Error updating user ID ${req.userId}:`, error);
        res.status(500).json({ message: "Error updating user" });
    }
});

// Route to update a users details as an admin
app.patch("/admin/updateUser", authenticateAdminToken, async (req, res) => {
    const { email, field, newValue1, newValue2 } = req.body;

    if (email === undefined || field === undefined || newValue1 === undefined || newValue2 === undefined) {
        console.log('Admin user update failed: Missing required fields');
        return res.status(400).json({ message: "Email, field, and new values are required" });
    }

    if (newValue1 !== newValue2) {
        console.log(`Admin user update failed: New values do not match for email ${email}`);
        return res.status(400).json({ message: "New values do not match" });
    }

    const validFields = ["name", "email", "organisation", "phoneNumber", "password", "isSignedIn", "isAdmin"];

    if (!validFields.includes(field)) {
        console.log(`Admin user update failed: Invalid field ${field} for email ${email}`);
        return res.status(400).json({ message: "Invalid field to update" });
    }

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log(`Admin user update failed: User not found for email ${email}`);
            return res.status(404).json({ message: "User not found" });
        }

        let newValue = newValue1;
        if (field === "password") {
            newValue = await hashPassword(newValue1);
        }

        user[field] = newValue;
        await user.save();

        if (field === "isSignedIn") {
            if (newValue) {
                signInLogFile.write(`[${new Date().toISOString()}] ${user.name} (${user.organisation}) Signed in to the site \n` )
            } else {
                signInLogFile.write(`[${new Date().toISOString()}] ${user.name} (${user.organisation}) Signed out of the site \n` )
            }
        }

        console.log(`Admin user update successful: Email ${email}, Field ${field}`);
        res.json({ message: "User updated successfully", updatedUser: { email, [field]: newValue } });
    } catch (error) {
        console.error(`Error updating user with email ${email}:`, error);
        res.status(500).json({ message: "Error updating user" });
    }
});

// Route to delete user account (refactored to use Sequelize)
app.delete("/user/delete", authenticateToken, async (req, res) => {
    console.log(`Delete User Request received for User ID ${req.userId}`);

    try {
        const user = await User.findOne({ where: { userId: req.userId } });

        if (!user) {
            console.log(`User delete failed: User ID ${req.userId} not found`);
            return res.status(404).json({ message: "User not found" });
        }

        await user.destroy();

        const qrCodePath = path.join(__dirname, `../data/qr-codes/${user.userId}.png`);
        if (fs.existsSync(qrCodePath)) {
            fs.unlinkSync(qrCodePath);
        }

        console.log(`User delete successful: User ID ${req.userId}`);
        res.json({ message: "User account deleted successfully" });
    } catch (error) {
        console.error(`Error deleting user ID ${req.userId}:`, error);
        res.status(500).json({ message: "Error deleting user account" });
    }
});

// Admin route to delete a user by email
app.delete("/admin/deleteUser", authenticateAdminToken, async (req, res) => {
    const { email } = req.body;

    if (!email) {
        console.log('Admin user delete failed: Email is required');
        return res.status(400).json({ message: "Email is required to delete a user" });
    }

    try {
        const user = await User.findOne({ where: { email: email } });

        if (!user) {
            console.log(`Admin user delete failed: User not found for email ${email}`);
            return res.status(404).json({ message: "User not found" });
        }

        await user.destroy();

        const qrCodePath = path.join(__dirname, `../data/qr-codes/${user.userId}.png`);
        if (fs.existsSync(qrCodePath)) {
            fs.unlinkSync(qrCodePath);
        }

        console.log(`Admin user delete successful: Email ${email}`);
        res.json({ message: "User account deleted successfully" });
    } catch (error) {
        console.error(`Error deleting user with email ${email}:`, error);
        res.status(500).json({ message: "Error deleting user account" });
    }
});

// Route to serve the Terms and Conditions (refactored)
app.get('/terms', (req, res) => {
    const termsFilePath = path.join(__dirname, '../data/terms-and-conditions.txt');
    
    fs.readFile(termsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading terms and conditions file:', err);
            return res.status(500).json({ message: "Error loading Terms and Conditions" });
        }
        console.log('Terms and Conditions served successfully');
        res.json({ terms: data });
    });
});

// Admin route to fetch user details by UUID
app.get("/admin/fetchUserDetailsUUID", authenticateAdminToken, async (req, res) => {
    const { uuid } = req.query;

    if (!uuid) {
        console.log('Fetch user details by UUID failed: UUID is required');
        return res.status(400).json({ message: "UUID is required to fetch user details" });
    }

    try {
        const user = await User.findOne({ where: { userId: uuid } });

        if (!user) {
            console.log(`Fetch user details by UUID failed: User not found for UUID ${uuid}`);
            return res.status(404).json({ message: "User not found" });
        }

        const { password, ...userData } = user.toJSON();
        console.log(`Fetch user details by UUID successful: UUID ${uuid}`);
        res.json(userData);
    } catch (error) {
        console.error(`Error fetching user details for UUID ${uuid}:`, error);
        res.status(500).json({ message: "Error fetching user details" });
    }
});

// Contact form submission endpoint (stores in Issues table)
app.post("/contact", async (req, res) => {
    const { email, message } = req.body;
    
    if (!message || message.trim() === "") {
        console.log('Contact form submission failed: Message cannot be empty');
        return res.status(400).json({ message: "Message cannot be empty" });
    }
    if (!email) {
        console.log('Contact form submission failed: Email cannot be empty');
        return res.status(400).json({ message: "Email cannot be empty" });
    }

    try {
        const newIssue = await Issue.create({
            id: uuidv4(),
            email: email,
            description: message,
            status: "open",
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        console.log(`Contact form submission successful: Issue ID ${newIssue.id}`);
        res.status(200).json({ message: "Issue submitted successfully!", issueId: newIssue.id });
    } catch (error) {
        console.error('Error saving issue:', error);
        res.status(500).json({ message: "Error submitting issue" });
    }
});

// Route to add or update the alert
app.post("/admin/addOrUpdateAlert", authenticateAdminToken, async (req, res) => {
    const { message, level } = req.body;

    if (!message || message.trim() === "") {
        return res.status(400).json({ message: "Alert message cannot be empty" });
    }

    if (!level || !["info", "warning", "critical"].includes(level)) {
        return res.status(400).json({ message: "Invalid alert level" });
    }

    try {
        // Find if there is an existing alert
        const existingAlert = await Alert.findOne();

        if (existingAlert) {
            // If an alert exists, update the existing alert
            existingAlert.message = message;
            existingAlert.level = level;

            // Save the updated alert
            await existingAlert.save();

            res.json({
                message: "Alert updated successfully",
                alert: existingAlert
            });
        } else {
            // If no alert exists, create a new one
            const newAlert = await Alert.create({ message, level });

            res.json({
                message: "Alert added successfully",
                alert: newAlert
            });
        }
    } catch (error) {
        console.error("Error adding or updating alert:", error);
        res.status(500).json({ message: "Error adding or updating alert" });
    }
});

// Deletes the alert from the database
app.delete("/admin/deleteAlert", authenticateAdminToken, async (req, res) => {
    try {
        // Find if an alert exists
        const existingAlert = await Alert.findOne();

        if (!existingAlert) {
            return res.status(404).json({ message: "No alert found to delete." });
        }

        // Delete the alert
        await existingAlert.destroy();

        return res.status(200).json({ message: "Alert deleted successfully." });
    } catch (error) {
        console.error("Error deleting alert:", error);
        res.status(500).json({ message: "Error deleting alert" });
    }
});

//Fetches current alert from database
app.get("/alert/get", authenticateToken, async (req, res) => {
    try {
        // Fetch the existing alert (since there's only one)
        const alert = await Alert.findOne();

        if (!alert) {
            return res.status(404).json({ message: "No alert found." });
        }

        // Return the alert message and level
        res.status(200).json({ message: alert.message, level: alert.level });
    } catch (error) {
        console.error("Error retrieving alert:", error);
        res.status(500).json({ message: "Error retrieving alert" });
    }
});

//Route to fetch all users
app.get("/admin/browseUsers", authenticateAdminToken, async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ["password"] } });
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Error retrieving data" });
    }
});

//Route to fetch open issues
app.get("/issues/getOpen", authenticateAdminToken, async (req, res) => {
    try {
        const issues = await Issue.findAll({
            where: {
                status: 'open'
            }
        });
        res.json(issues);
    } catch (error) {
        console.error("Error fetching issues:", error);
        res.status(500).json({ message: "Error fetching issues" });
    }
});

//Route to resolve an issue
app.patch("/issues/resolve/:id", authenticateAdminToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Find the issue by ID
        const issue = await Issue.findByPk(id);
        if (!issue) {
            return res.status(404).json({ message: "Issue not found" });
        }

        // Update the status to "resolved"
        issue.status = "resolved";
        await issue.save();

        res.json({ message: "Issue marked as resolved", issue });
    } catch (error) {
        console.error("Error resolving issue:", error);
        res.status(500).json({ message: "Error resolving issue" });
    }
});


//route to get server logs
app.get("/recentLogs", authenticateAdminToken, async (req, res) => {
    try {
        const logFilePath = path.join(__dirname, "../data/server.log");

        // Check if the log file exists
        if (!fs.existsSync(logFilePath)) {
            return res.status(404).json({ message: "Log file not found" });
        }

        // Read log file
        const logData = fs.readFileSync(logFilePath, "utf8");

        // Split log file into lines and get the last 1000
        const logLines = logData.trim().split("\n");
        const lastLogs = logLines.slice(-1000);

        res.json({ logs: lastLogs });
    } catch (error) {
        console.error("Error fetching logs:", error);
        res.status(500).json({ message: "Error fetching logs" });
    }
});


//Route to download server logs
app.get("/logs/download/serverLog", authenticateAdminToken, (req, res) => {
    const logFilePath = path.join(__dirname, "../data/server.log");
    const tempTxtFilePath = path.join(__dirname, "../data/server_logs.txt");

    // Copy & rename the log file as a .txt file
    fs.copyFile(logFilePath, tempTxtFilePath, (err) => {
        if (err) {
            console.error("Error converting log file:", err);
            return res.status(500).json({ message: "Error processing log file" });
        }

        // Send the file as a .txt download
        res.download(tempTxtFilePath, "server_logs.txt", (err) => {
            if (err) {
                console.error("Error sending log file:", err);
                return res.status(500).json({ message: "Error downloading log file" });
            }

            // Cleanup: Delete temp file after sending
            fs.unlink(tempTxtFilePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error("Error deleting temporary log file:", unlinkErr);
                }
            });
        });
    });
});

// Route to get the last 200 sign-in logs
app.get("/logs/signins", authenticateToken, (req, res) => {
    const logFilePath = path.join(__dirname, "../data/siteLog.log");

    fs.readFile(logFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading sign-in logs:", err);
            return res.status(500).json({ message: "Error reading logs" });
        }

        // Split logs into lines and get the last 200 entries
        const logLines = data.trim().split("\n");
        const last200Logs = logLines.length > 200 ? logLines.slice(-200).reverse() : logLines.reverse(); // Reverse to show latest first

        res.json({ logs: last200Logs });
    });
});

app.get("/admin/downloadSignedInUsers", authenticateAdminToken, async (req, res) => {
    try {
        // Fetch only signed-in users and explicitly select relevant columns
        const signedInUsers = await User.findAll({
            where: { isSignedIn: true },
            attributes: ["name", "email", "organisation", "phoneNumber", "updatedAt"], // Ensure clean selection
            raw: true // Ensure we get plain JSON instead of Sequelize instances
        });

        if (signedInUsers.length === 0) {
            return res.status(404).json({ message: "No users are currently signed in." });
        }

        // Format timestamps properly
        signedInUsers.forEach(user => {
            user.updatedAt = new Date(user.updatedAt).toISOString(); // Convert to readable format
        });

        // Convert JSON to CSV
        const json2csvParser = new Parser({ fields: ["name", "email", "organisation", "phoneNumber", "updatedAt"] });
        const csv = json2csvParser.parse(signedInUsers);

        // Save to file
        const filePath = path.join(__dirname, "../data/signedInUsers.csv");
        fs.writeFileSync(filePath, csv);

        // Send file to client
        res.download(filePath, "signedInUsers.csv", (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).json({ message: "Error downloading the file" });
            }
        });

    } catch (error) {
        console.error("Error fetching signed-in users:", error);
        res.status(500).json({ message: "Error generating signed-in users list" });
    }
});







// Route to serve index.html at the root of your site
app.get('/', (req, res) => {
    console.log(`[${new Date().toISOString()}] Serving index.html`);
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Override console.log to include timestamps and write to both the console and the file
console.log = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    // Write to the console
    process.stdout.write(logMessage + '\n');
    // Write to the log file
    logFile.write(logMessage + '\n');
};


const PORT = 8443; // Standard HTTPS port


// Load SSL certificate and private key
const options = {
    key: fs.readFileSync(path.join(__dirname, "key.pem")),  // Private key
    cert: fs.readFileSync(path.join(__dirname, "cert.pem")) // SSL certificate
};

// Middleware & Routes
app.get("/", (req, res) => {
    res.send("Hello, HTTPS is working!");
});

// Start HTTPS server
https.createServer(options, app).listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
});




