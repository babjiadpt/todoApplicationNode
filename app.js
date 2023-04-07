const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server started at http://localhost3000");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//API: 1;
//Returns a list of all todos whose status is 'TO DO' API
app.get("/todos/", async (request, response) => {
  let responseData = null;
  let getTodosQuery = "";

  const { search_q = "", status, priority } = request.query;

  switch (true) {
    case hasStatusProperty(request.query):
      getTodosQuery = `
          SELECT 
            *
          FROM 
                todo
          WHERE 
                status LIKE '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
          SELECT 
            *
          FROM 
                todo
          WHERE 
                priority LIKE '${priority}';`;
      break;
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
          SELECT 
            *
          FROM 
                todo
          WHERE 
                status LIKE '${status} 
                AND priority LIKE '${priority}';`;
      break;
    default:
      getTodosQuery = `
        SELECT
          *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%';`;
  }

  responseData = await db.all(getTodosQuery);
  response.send(responseData);
});

//API: 2;
//Returns a specific todo based on the todo ID API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
      *
    FROM 
        todo
    WHERE 
        id = ${todoId};`;

  const responseTodoObject = await db.get(getTodoQuery);
  response.send(responseTodoObject);
});

//API: 3;
//Create a todo in the todo table API
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodoQuery = `
    INSERT INTO 
        todo (id, todo, priority, status)
    VALUES (
            '${id}',
            '${todo}', 
            '${priority}',
            '${status}'
            );`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//API: 4;
//Updates the details of a specific todo based on the todo ID API
app.put("/todos/:todoId/", async (request, response) => {
  let updatedColumn = "";
  let updateTodosQuery = "";
  const { todoId } = request.params;

  const propertiesData = request.body;

  switch (true) {
    case propertiesData.todo !== undefined:
      updatedColumn = "Todo";
      break;
    case propertiesData.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case propertiesData.status !== undefined:
      updatedColumn = "Status";
      break;
  }

  const previousTodoQuery = `
      SELECT 
         *
      FROM
            todo
      WHERE
            id = ${todoId};`;
  const previousTodoResponse = await db.get(previousTodoQuery);

  const {
    todo = previousTodoResponse.todo,
    priority = previousTodoResponse.priority,
    status = previousTodoResponse.status,
  } = request.body;

  const updateTodoQuery = `
      UPDATE 
            todo
      SET 
            todo = '${todo}',
            priority = '${priority}',
            status = '${status}'
      WHERE 
            id = '${todoId}';`;

  await db.run(updateTodoQuery);
  response.send(`${updatedColumn} Updated`);
});

//API; 5;
//Deletes a todo from the todo table based on the todo ID API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM 
        todo
    WHERE 
        id = '${todoId}';`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
