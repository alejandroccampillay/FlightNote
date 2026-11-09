// Configuración de Metro: incluir las bases SQLite (.sqlite) como assets de la app.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('sqlite', 'db');

module.exports = config;
