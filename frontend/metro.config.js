const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force Metro to look in the local node_modules
config.resolver.nodeModulesPaths = [
    path.resolve(__dirname, 'node_modules'),
];
config.resolver.extraNodeModules = {
    'expo-linear-gradient': path.resolve(__dirname, 'node_modules/expo-linear-gradient'),
    '@react-navigation/native': path.resolve(__dirname, 'node_modules/@react-navigation/native'),
    '@react-navigation/stack': path.resolve(__dirname, 'node_modules/@react-navigation/stack'),
};
config.watchFolders = [__dirname];

module.exports = withNativeWind(config, { input: "./global.css" });
