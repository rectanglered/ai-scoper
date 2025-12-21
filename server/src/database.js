const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: false
});

const Session = sequelize.define('Session', {
    sessionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    clientName: {
        type: DataTypes.STRING,
        defaultValue: 'Guest'
    },
    projectName: {
        type: DataTypes.STRING
    },
    description: {
        type: DataTypes.TEXT
    },
    platforms: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    targetUsers: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    selectedFeatures: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    budget: {
        type: DataTypes.STRING
    },
    contactName: { type: DataTypes.STRING },
    contactCompany: { type: DataTypes.STRING },
    contactJobTitle: { type: DataTypes.STRING },
    contactEmail: { type: DataTypes.STRING },
    contactPhone: { type: DataTypes.STRING },
    history: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    answers: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    report: {
        type: DataTypes.TEXT
    }
});

const ErrorLog = sequelize.define('ErrorLog', {
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    level: { type: DataTypes.STRING }, // 'error', 'warning', 'info'
    message: { type: DataTypes.TEXT },
    stack: { type: DataTypes.TEXT }
});

async function initDb() {
    try {
        await sequelize.sync({ alter: true }); // sync({ force: true }) to reset
        console.log('Database synced');
    } catch (error) {
        console.error('Error syncing database:', error);
    }
}

module.exports = {
    sequelize,
    Session,
    ErrorLog,
    initDb
};
