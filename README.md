# Tunes Webpage

## Overview

Tunes Webpage is a full-stack web application that provides user authentication, database management, and an admin dashboard for monitoring users and system activity.

## Features

- User authentication (login, logout, session management)
- Admin dashboard for managing users, issues, and alerts
- QR code-based login system
- Log management with downloadable logs
- Content Security Policy (CSP) enforcement for security
- HTTPS support

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [MySQL](https://www.mysql.com/)
- [Git](https://git-scm.com/)

### Setup Instructions

1. **Clone the repository**
   ```sh
   git clone https://github.com/yourusername/tunes-webpage.git
   cd tunes-webpage
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Set up the database**
   - Configure your MySQL instance
   - Run the database migration script:
     ```sh
     npm run migrate
     ```

4. **Start the server**
   ```sh
   npm start
   ```

5. **Access the application**
   - Open a browser and go to `http://localhost:3000`

## API Endpoints

### User Routes

- `POST /auth/login` – Authenticate a user
- `POST /auth/logout` – Log out a user
- `GET /user/details` – Retrieve authenticated user details

### Admin Routes

- `GET /admin/getUser?email={email}` – Fetch a user by email
- `PATCH /admin/updateUser` – Update user data
- `DELETE /admin/deleteUser` – Delete a user by email
- `GET /admin/fetchUserDetailsUUID?uuid={uuid}` – Fetch user details by UUID
- `POST /admin/addAlert` – Add a system-wide alert
- `DELETE /admin/deleteAlert` – Remove the current alert
- `GET /admin/getSignedInUsers` – Fetch users who are currently signed in
- `GET /admin/userCounts` – Get total users and signed-in users

### Logging & Monitoring

- `GET /logs/recent` – Get the last 1000 server logs
- `GET /logs/download` – Download full server logs
- `GET /signin/logs` – Retrieve the latest 200 sign-ins

## Security Measures

- **Prepared statements** prevent SQL injection
- **Content Security Policy (CSP)** mitigates XSS attacks
- **HTTPS enforcement** for secure communication
- **Authentication tokens** (JWT-based) for protected routes
- **Role-based access control** for admin actions

## Contributing

1. Fork the repository
2. Create a new branch
   ```sh
   git checkout -b feature-branch
   ```
3. Make your changes and commit
   ```sh
   git commit -m "Add new feature"
   ```
4. Push to your fork
   ```sh
   git push origin feature-branch
   ```
5. Open a pull request

## License

This project is property of Tunes Festivals. Feel free to use it as a template, but note that all Tunes branding is subject to copyright and must not be included. 

