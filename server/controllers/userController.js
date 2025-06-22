const userService = require('../services/userService');

async function getUser(req, res) {
  try {
    const userAddress = req.params.userAddress;
    const user = await userService.getUser(userAddress);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { getUser };