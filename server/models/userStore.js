const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
const HISTORY_FILE = path.join(__dirname, '..', 'data', 'history.json');

function ensureFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]', 'utf-8');
}

function readJSON(filePath) {
  ensureFile(filePath);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return [];
  }
}

function writeJSON(filePath, data) {
  ensureFile(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ── Users ─────────────────────────────────────
function getUsers() {
  return readJSON(USERS_FILE);
}

function findUserByEmail(email) {
  return getUsers().find((u) => u.email === email.toLowerCase()) || null;
}

function findUserById(id) {
  return getUsers().find((u) => u.id === id) || null;
}

function addUser(user) {
  const users = getUsers();
  users.push(user);
  writeJSON(USERS_FILE, users);
}

// ── History ────────────────────────────────────
function getAllHistory() {
  return readJSON(HISTORY_FILE);
}

function getUserHistory(userId) {
  return getAllHistory()
    .filter((h) => h.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function addHistoryEntry(entry) {
  const history = getAllHistory();
  history.unshift(entry);
  writeJSON(HISTORY_FILE, history);
}

function deleteHistoryEntry(id, userId) {
  const history = getAllHistory().filter(
    (h) => !(h.id === id && h.userId === userId)
  );
  writeJSON(HISTORY_FILE, history);
}

function clearUserHistory(userId) {
  const history = getAllHistory().filter((h) => h.userId !== userId);
  writeJSON(HISTORY_FILE, history);
}

module.exports = {
  findUserByEmail,
  findUserById,
  addUser,
  getUserHistory,
  addHistoryEntry,
  deleteHistoryEntry,
  clearUserHistory,
};
