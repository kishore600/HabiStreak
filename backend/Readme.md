✅ 1. auth.Routes.js

POST /register – Register user
POST /login – Login user
GET /me – Get current user

✅ 2. user.Routes.js

Follow/unfollow users

Get followed users

Get mutual habits

GET /api/users/:id          
POST /api/users/follow/:id  
POST /api/users/unfollow/:id
GET /api/users/following    

✅ 3. habit.Routes.js

Create personal habits

Get user habits

Delete habits

POST /api/habits            
GET /api/habits             
DELETE /api/habits/:id      


✅ 4. group.Routes.js

Auto-create group from shared habits

Get group info

Update goal/todo (admin only)

Group streak

GET /api/groups                  
POST /api/groups/create-or-join  
PATCH /api/groups/:id            
GET /api/groups/:id/streak       

✅ 5. todo.Routes.js
Handles:

Mark daily task complete

Check completion status

Track individual & group streaks


POST /api/todos/:groupId/complete      
GET /api/todos/:groupId/status         

✅ 6. leaderboard.Routes.js

Rank members within group by streaks or completion rate

GET /api/leaderboard/:groupId  


/routes
├── auth.Routes.js
├── user.Routes.js
├── habit.Routes.js
├── group.Routes.js
├── todo.Routes.js
├── leaderboard.Routes.js

/controllers
├── auth.controller.js
├── user.controller.js
├── habit.controller.js
├── group.controller.js
├── todo.controller.js
├── leaderboard.controller.js

/models
├── User.js
├── Habit.js
├── Group.js
├── TodoCompletion.js
