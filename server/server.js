const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const QRCode = require("qrcode");
const crypto = require("crypto");
const { get } = require('http');
require('dotenv').config();

const secretKey = process.env.JWT_SECRET; // Retrieve the secret key from .env for security

function hashEmail(email) {
        return crypto.createHash("sha256").update(email).digest("hex"); // SHA-256 hash
    }

// Initialize the app
const app = express();

// Middleware to serve static files
app.use(express.static(path.join(__dirname, '../public'))); // Serve files from the 'public' folder

// Middleware to parse JSON
app.use(express.json());  // For parsing application/json

// Function to get users from the users.json file
function getUsers() {
    const usersFilePath = path.join(__dirname, '../data/users.json');
    const usersData = fs.readFileSync(usersFilePath, 'utf-8');
    return JSON.parse(usersData); // Parse the JSON file content
}

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

// POST route for login
app.post('/login', async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
        }

        const users = getUsers(); // Load users from users.json

        const user = users.find(user => user.email === email);
        if (!user) {
                return res.status(400).json({ message: `Invalid email: ${email}` });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {   
                return res.status(400).json({ message: "Invalid password" });
        }

        // Generate JWT Token
        const token = jwt.sign({ email: user.email }, secretKey, { expiresIn: "1h" });

        res.json({ token, redirectUrl: '/dashboard' });
});

// Middleware to verify token
function authenticateToken(req, res, next) {
        const token = req.headers["authorization"];

        if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

        jwt.verify(token, secretKey, (err, decoded) => {
                if (err) return res.status(403).json({ message: "Invalid token." });

                req.user = decoded; // Store decoded user data in request
                next();
        });
}

// Function to get user details from token
function getUserFromToken(token) {
    try {
        const decoded = jwt.verify(token, secretKey); // Decode token

        const email = decoded.email; // Extract email from token
        if (!email) return null; // If no email, return null

        // Load users from users.json
        const users = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users.json'), "utf8"));

        // Find user by email
        return users.find(user => user.email === email) || null;
    } catch (err) {
        return null; // Invalid token
    }
}


// Route to fetch user details
app.get("/user", authenticateToken, (req, res) => {
        const users = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users.json'), "utf8"));
        const user = users.find((u) => u.email === req.user.email);

        

        if (!user) {
                return res.status(404).json({ message: "User not found" });
        }

        // Return user data (excluding password)margin: 20px; /* Add margin to the sides */
        const { password, ...userData } = user;
        res.json(userData);
});

// Route to fetch admin details
app.get("/admin", authenticateToken, (req, res) => {
        const users = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users.json'), "utf8"));
        const user = users.find((u) => u.email === req.user.email);

        if (!user) {
                return res.status(404).json({ message: "User not found" });
        }

        if (!user.admin) {
                return res.status(403).json({ message: "Unauthorized" });
        } 

        // Return user data (excluding password)
        const { password, ...userData } = user;
        res.json(userData);
        
});

// Signup endpoint
app.post("/signup", async (req, res) => {
        const { name, password, repeatPassword, email, organisation, phoneNumber } = req.body;
    
        if (!name || !password || !repeatPassword || !email || !organisation || !phoneNumber) {
            return res.status(400).json({ message: "All fields are required" });
        }
    
        const users = getUsers(); // Load existing users
    
        if (users.find(user => user.email === email)) {
            return res.status(400).json({ message: "Email already exists" });
        }
    
        if (password !== repeatPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }
    
        // Validate email
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }
    
        // Validate phone number
        if (!isValidPhone(phoneNumber)) {
            return res.status(400).json({ message: "Invalid phone number format" });
        }
    
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
    
        // Hash the email for privacy
        const hashedEmail = crypto.createHash('sha256').update(email).digest('hex');
    
        // Generate a QR Code (using the hashed email as the identifier)
        const qrCodeDir = path.join(__dirname, '../data/qr-codes');
        if (!fs.existsSync(qrCodeDir)) {
            fs.mkdirSync(qrCodeDir, { recursive: true });
        }
    
        const qrCodePath = path.join(qrCodeDir, `${hashedEmail}.png`);
        const qrCodeData = `user:${hashedEmail}`; // You can encode more data if needed
    
        await QRCode.toFile(qrCodePath, qrCodeData);
    
        // Add user to the JSON file
        const signed_in = false;
        const admin = false;
    
        users.push({
            name,
            password: hashedPassword,
            email: email, // Store hashed email
            organisation,
            phoneNumber,
            signed_in,
            admin,
            qrCodeData, // Store QR code data 

        });
    
        fs.writeFileSync(path.join(__dirname, '../data/users.json'), JSON.stringify(users, null, 2));
    
        res.json({ message: "Account created successfully!" });
    });



// Contact form submission endpoint
app.post("/contact", (req, res) => {
        const { email, message } = req.body;
        if (!message || message.trim() === "") {
                return res.status(400).json({ message: "Message cannot be empty" });
        }

        if (!email) {
                return res.status(400).json({ message: "Email cannot be empty" });
        }

        // Save the message in a text file
        fs.appendFileSync("server/messages.txt", email + "\n");
        fs.appendFileSync("server/messages.txt", message + "\n");
        fs.appendFileSync("server/messages.txt", "\n");

        res.json({ message: "Message sent successfully!" });
});

// Route to fetch user details as an admin
app.get('/user-details', (req, res) => {
        const token = req.headers.authorization; // Token from headers
        const email = req.query.email; // Email from query parameters
    
        if (!token) {
            return res.status(403).json({ message: 'Access denied: no token provided' });
        }

        if (!isAdmin(token)) {  
                return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
    
        if (!email) {
            return res.status(400).json({ message: 'Email parameter is required.' });
        }
    
        // Read users from the JSON file (assuming users are stored in a JSON file)
        const users = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users.json'), "utf8"));
        const user = users.find(u => u.email === email);
    
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
    
        res.json({
            name: user.name,
            email: user.email,
            organisation: user.organisation,
            admin: user.admin,
            phoneNumber: user.phoneNumber,
            signed_in:  user.signed_in

        });
    });

    // Route to update user details as an admin
app.post("/admin/updateUser", async (req, res) => {
        const { email, field, newValue } = req.body;
        const token = req.headers.authorization?.split(" ")[1]; // Extract token
    
        if (!token) {
            return res.status(403).json({ message: "No token" });
        }
        
        
        if (!isAdmin(token) && !(getUserFromToken(token).email === email)) {
            return res.status(403).json({ message: "Unauthorized"});
        } 
        
        if (getUserFromToken(token).email === email && field === "admin") {
                return res.status(403).json({ message: "Unauthorized, cannot change admin status" });
        }

        // Load user data from JSON file (or use a database)
        const usersPath = path.join(__dirname, '../data/users.json');
        let users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
    
        const userIndex = users.findIndex(user => user.email === email);
        if (userIndex === -1) {
            return res.status(404).json({ message: "User not found" });
        }
    
        // Ensure the field exists before updating
        if (!(field in users[userIndex])) {
            return res.status(400).json({ message: "Invalid field name" });
        }
        
        if (field === "password") {
                users[userIndex][field] = await hashPassword(newValue);
        } else {
            users[userIndex][field] = newValue;
        }
    
        // Save updated data
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    
        res.json({ message: "User updated successfully!" });
    });
    
//Admin endpoint to delete a user
app.post("/admin/deleteUser", (req, res) => {
        const { email } = req.body;
        const token = req.headers.authorization?.split(" ")[1]; // Extract token

        if (!token) {
                return res.status(403).json({ message: "No token" });
        }

        if (!isAdmin(token) || !(getUserFromToken(token).email === email)) {
                return res.status(403).json({ message: "Unauthorized" + email });
            } 
            

        // Load user data from JSON file (or use a database)
        const usersPath = path.join(__dirname, '../data/users.json');
        let users = JSON.parse(fs.readFileSync(usersPath, "utf8"));

        const userIndex = users.findIndex(user => user.email === email);
        if (userIndex === -1) {
                return res.status(404).json({ message: "User not found" });
        }

        // Remove the user from the array
        users.splice(userIndex, 1);

        // Save updated data
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        return res.status(200).json({ message: `User ${email} deleted successfully` });
});

// Route to serve QR code
app.get("/user/qr", (req, res) => {
        const token = req.headers.authorization?.split(" ")[1]; // Extract token
    
        if (!token) {
            return res.status(403).json({ message: "No token provided" });
        }
    
        const user = getUserFromToken(token); // Function that gets user info from token
        if (!user) {
            return res.status(403).json({ message: "Invalid token" });
        }
    
        const hashedEmail = hashEmail(user.email); // The email is already hashed in users.json
        const qrCodePath = path.join(__dirname, `../data/qr-codes/${hashedEmail}.png`);
    
        if (!fs.existsSync(qrCodePath)) {
            return res.status(404).json({ message: "QR code not found" });
        }
    
        res.sendFile(qrCodePath); // Serve the QR code image
    });
    
//endpoint to get user info from qr code
app.post("/process-qr", (req, res) => {
        const token = req.headers.authorization?.split(" ")[1]; // Extract token
        const { qrData } = req.body;
        //console.log("Received QR Code Data:", qrData);
    
        // Perform actions based on the QR code (e.g., lookup user info)
        if (!isAdmin(token)) {
                return res.status(403).json({ message: "Unauthorized" });
        } 

        // Read users from the JSON file (assuming users are stored in a JSON file)
        const users = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users.json'), "utf8"));
        const user = users.find(u => u.qrCodeData === qrData);
    
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.status(200).json({ message: 'User found.' + user.email, 
                email: user.email, 
                signed_in: user.signed_in,
                organisation :user.organisation,
                name: user.name });
        
    });
    
    
    

// Route to serve index.html at the root of your site
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html')); // Send the index.html when visiting '/'
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});


