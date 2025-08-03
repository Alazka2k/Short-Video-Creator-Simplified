const jobDataAccess = require('../data/jobDataAccess');

async function getStats(req, res) {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const stats = await jobDataAccess.getUserContentStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting user content stats:', error);
    res.status(500).json({ error: 'Failed to retrieve content statistics' });
  }
}

module.exports = {
  getStats,
};