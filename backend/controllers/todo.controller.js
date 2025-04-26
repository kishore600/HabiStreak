const markTodo = (req, res) => {
    res.send('Mark todo completed');
  };
  
const getTodosByGroup = (req, res) => {
    res.send(`Get todos for group: ${req.params.groupId}`);
  };

  module.exports = {markTodo,getTodosByGroup}