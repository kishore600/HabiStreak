
const createHabit = (req, res) => {
    res.send('Create new habit');
  };
  

  const getUserHabits = (req, res) => {
    res.send(`Get habits for user: ${req.params.userId}`);
  };

  module.exports = {createHabit,getUserHabits}