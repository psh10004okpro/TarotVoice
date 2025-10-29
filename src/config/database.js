const { Sequelize } = require('sequelize');
const path = require('path');

// Configure database based on environment
let sequelize;

if (process.env.DATABASE_URL) {
  // Production: Use PostgreSQL (Railway automatically provides DATABASE_URL)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
  console.log('Using PostgreSQL database');
} else {
  // Development: Use SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_PATH || path.join(__dirname, '../../database.sqlite'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    },
  });
  console.log('Using SQLite database');
}

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, testConnection };
