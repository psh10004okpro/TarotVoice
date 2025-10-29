const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AudioFile = sequelize.define('AudioFile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  service: {
    type: DataTypes.ENUM('elevenlabs', 'naver', 'google'),
    allowNull: false,
  },
  voice_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'ko-KR',
  },
  file_path: {
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
  format: {
    type: DataTypes.STRING,
    defaultValue: 'mp3',
  },
  hash: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: 'Hash of text+service+voice_id for caching',
  },
  play_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  last_played_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'audio_files',
  indexes: [
    {
      unique: true,
      fields: ['hash'],
    },
    {
      fields: ['service'],
    },
    {
      fields: ['created_at'],
    },
  ],
});

module.exports = AudioFile;
