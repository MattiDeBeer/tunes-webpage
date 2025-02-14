const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");

// Connect to SQLite database
const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: path.join(__dirname, "../data/database.sqlite"),
    logging: false,
});

// Define User model
const User = sequelize.define("User", {
    userId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        unique: true, 
        set(value) { this.setDataValue("email", value.toLowerCase()); } 
    },
    password: { type: DataTypes.STRING, allowNull: false },
    isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
    isSignedIn : { type: DataTypes.BOOLEAN, defaultValue: false },
    organisation: { type: DataTypes.STRING, allowNull: false },
    phoneNumber: { type: DataTypes.STRING, allowNull: false },
    agreedToTerms: { type: DataTypes.BOOLEAN, defaultValue: true },

}, { timestamps: true });

// Define Alert model (Only 1 Alert allowed)
const Alert = sequelize.define("Alert", {
    message: { type: DataTypes.STRING, allowNull: false, unique: true },
    level: { type: DataTypes.ENUM("info", "warning", "critical"), allowNull: false },
}, {
    timestamps: true,
    hooks: {
        beforeCreate: async (alert) => {
            const count = await Alert.count();
            if (count >= 1) {
                throw new Error("Only one alert message is allowed.");
            }
        },
        beforeUpdate: async (alert) => {
            const existingAlert = await Alert.findOne();
            if (existingAlert && existingAlert.id !== alert.id) {
                throw new Error("Only one alert message is allowed.");
            }
        }
    }
});

// Define Issue model
const Issue = sequelize.define("Issue", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        set(value) { this.setDataValue("email", value.toLowerCase()); } 
    },
    description: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM("open", "resolved"), defaultValue: "open" },
}, { timestamps: true });

// Sync database
sequelize.sync({ force: false }).then(() => {  
    console.log("Database & tables synced!");
});

module.exports = { sequelize, User, Alert, Issue };
