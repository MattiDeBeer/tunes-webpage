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

const Issue = sequelize.define("Issue", {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    email: DataTypes.STRING,
    description: DataTypes.TEXT,
    status: {
        type: DataTypes.STRING,
        defaultValue: "open"
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: "general"
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    newValue: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, { timestamps: true });

const Festival = sequelize.define("Festival", {
    name: { type: DataTypes.STRING, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    inductionLink: { type: DataTypes.STRING, allowNull: true, defaultValue: null }
  }, { timestamps: false });

const UserFestival = sequelize.define("UserFestival", {
    parkingType: {
        type: DataTypes.ENUM("AAA", "Standard", "Staff", "VIP", "Trader", "Camping"),
        allowNull: true,
        defaultValue: "Standard",
    }
}, { timestamps: false });

User.belongsToMany(Festival, { through: UserFestival });
Festival.belongsToMany(User, { through: UserFestival });

const festivalsToAdd = [
    { name: 'Tunes on the bay', location: 'Swansea', startDate: '2025-02-05', endDate: '2025-04-05' },
    { name: 'Bands on the sands', location: 'Perranporth', startDate: '2025-05-16', endDate: '2025-05-17' },
    { name: 'Tunes in the Castle', location: 'Exeter', startDate: '2025-05-23', endDate: '2025-05-25' },
    { name: 'Tunes in the Dunes', location: 'Perranporth', startDate: '2025-06-06', endDate: '2025-08-06' },
    { name: 'Hootenanny Faye', location: 'Port Elliott Estate', startDate: '2025-06-19', endDate: '2025-06-22' },
    { name: 'Wild Gardens', location: 'Port Elliott Estate', startDate: '2024-07-18', endDate: '2024-07-20' },
    { name: 'Tunes at the Coliseum', location: 'Carlyon Bay', startDate: '2024-06-25', endDate: '2024-07-26' },
    { name: 'Tunes in the Park', location: 'Port Elliott Estate', startDate: '2024-08-21', endDate: '2024-08-24' },
    { name: 'Bands on the sands', location: 'Perranporth', startDate: '2024-09-05', endDate: '2024-09-06' },
    { name: 'Pentunes', location: 'Pentewan', startDate: '2024-09-19', endDate: '2024-09-20' },
];

(async () => {
    await sequelize.sync();

    const count = await Festival.count();
    if (count === 0) {
        await Festival.bulkCreate(festivalsToAdd);
        console.log("Added initial festival data.");
    }
})();

// Sync database
sequelize.sync({ force: false }).then(() => {  
    console.log("Database & tables synced!");
});

module.exports = { sequelize, User, Alert, Issue, Festival, UserFestival };
