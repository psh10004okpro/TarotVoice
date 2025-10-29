const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ManagedAudioFile = sequelize.define('ManagedAudioFile', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    comment: 'Custom ID provided by user',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  original_filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  file_size: {
    type: DataTypes.INTEGER,
  },
  duration: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  mime_type: {
    type: DataTypes.STRING,
    defaultValue: 'audio/mpeg',
  },
  format: {
    type: DataTypes.STRING,
    comment: 'File extension (mp3, wav, etc.)',
  },
  download_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  play_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  last_accessed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'managed_audio_files',
  indexes: [
    {
      unique: true,
      fields: ['id'],
    },
    {
      fields: ['created_at'],
    },
  ],
});

module.exports = ManagedAudioFile;
