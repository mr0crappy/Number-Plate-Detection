const { getUserHistory, deleteHistoryEntry, clearUserHistory } = require('../models/userStore');

exports.getHistory = (req, res) => {
  const history = getUserHistory(req.user.id);
  return res.json({ success: true, history });
};

exports.deleteEntry = (req, res) => {
  deleteHistoryEntry(req.params.id, req.user.id);
  return res.json({ success: true, message: 'Entry deleted.' });
};

exports.clearHistory = (req, res) => {
  clearUserHistory(req.user.id);
  return res.json({ success: true, message: 'History cleared.' });
};
