# Database Configuration Guide

## SQLite (Default)

The system uses SQLite by default, which is suitable for development and small-scale production.

### Advantages
- No setup required
- File-based, portable
- Good for development and small-scale applications
- Included by default

### Protection Measures
1. **Git Ignore**: Database files are excluded from git
2. **Automatic Backups**: Configurable automatic backups
3. **Manual Backups**: API endpoints for manual backup/restore
4. **Backup Storage**: Backups stored in `/backups` directory

### Configuration
```env
DB_PATH=./database.sqlite
AUTO_BACKUP_ENABLED=true
AUTO_BACKUP_INTERVAL_HOURS=24
MAX_AUTO_BACKUPS=10
```

## PostgreSQL (Production Recommended)

For production environments, PostgreSQL is recommended for better reliability and scalability.

### Setup

1. Install required package:
```bash
npm install pg pg-hstore
```

2. Update `src/config/database.js`:
```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tarotvoice',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
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
```

3. Update `.env`:
```env
# Database Configuration
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tarotvoice
DB_USER=postgres
DB_PASSWORD=your_password_here
```

### Advantages
- Better performance for concurrent connections
- Advanced features (full-text search, JSON support)
- Better data integrity
- Suitable for production
- Built-in backup tools

### Backup for PostgreSQL
```bash
# Create backup
pg_dump -U postgres tarotvoice > backup.sql

# Restore backup
psql -U postgres tarotvoice < backup.sql
```

## MySQL (Alternative)

MySQL is another good option for production environments.

### Setup

1. Install required package:
```bash
npm install mysql2
```

2. Update `src/config/database.js`:
```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'tarotvoice',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
  },
});
```

3. Update `.env`:
```env
# Database Configuration
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tarotvoice
DB_USER=root
DB_PASSWORD=your_password_here
```

### Backup for MySQL
```bash
# Create backup
mysqldump -u root -p tarotvoice > backup.sql

# Restore backup
mysql -u root -p tarotvoice < backup.sql
```

## Choosing a Database

| Feature | SQLite | PostgreSQL | MySQL |
|---------|--------|------------|-------|
| Setup Complexity | None | Medium | Medium |
| Concurrent Writes | Limited | Excellent | Excellent |
| Max Database Size | ~140 TB | Unlimited | ~64 TB |
| Performance (Reads) | Fast | Very Fast | Very Fast |
| Performance (Writes) | Good | Excellent | Excellent |
| Suitable For | Dev, Small Apps | Production | Production |
| Backup Complexity | Simple | Medium | Medium |

## Recommendations

- **Development**: Use SQLite (default)
- **Small Production (< 100 concurrent users)**: SQLite with automatic backups
- **Medium to Large Production**: PostgreSQL
- **Alternative for Production**: MySQL

## Migration from SQLite to PostgreSQL/MySQL

Use Sequelize migrations or a database migration tool to move data from SQLite to PostgreSQL/MySQL when scaling up.
