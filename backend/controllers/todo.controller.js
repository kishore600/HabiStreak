
export const markTodo = (req, res) => {
    res.send('Mark todo completed');
  };
  
  export const getTodosByGroup = (req, res) => {
    res.send(`Get todos for group: ${req.params.groupId}`);
  };