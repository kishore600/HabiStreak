
export const createHabit = (req, res) => {
    res.send('Create new habit');
  };
  

  export const getUserHabits = (req, res) => {
    res.send(`Get habits for user: ${req.params.userId}`);
  };