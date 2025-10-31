const fs = require('fs').promises;
const path = require('path');

/**
 * Asynchronously deletes a file.
 * @param {string} filePath - The path to the file to delete.
 */
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    console.log(`Successfully deleted ${filePath}`);
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    // We don't throw an error here because we want the main operation to continue
    // even if the file cleanup fails.
  }
};

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - The path to the directory.
 */
const ensureDirExists = async (dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw error;
  }
};

module.exports = {
  deleteFile,
  ensureDirExists,
};
