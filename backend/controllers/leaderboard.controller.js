const getLeaderboard = (req, res) => {
    res.send(`Get leaderboard for group: ${req.params.groupId}`);
  };

  module.exports ={getLeaderboard}