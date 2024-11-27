const express = require('express');
const app = express();
const PORT = 3000;
const pool = require('./db');

app.use(express.json());

// create task table if it doesn't already exist
const createTable = async() => {
    try{
        await pool.query(`CREATE TABLE IF NOT EXISTS tasks(
                            id SERIAL PRIMARY KEY,
                            description VARCHAR(250) NOT NULL,
                            status VARCHAR(100) NOT NULL
                            );`);
        console.log("tasks table created successfully.");
        }
        catch(error){
            console.error('error occured. table could not be created.')
        }
}

let tasks = [
    { id: 1, description: 'Buy groceries', status: 'incomplete' },
    { id: 2, description: 'Read a book', status: 'complete' },
];

// GET /tasks - Get all tasks
app.get('/tasks', async(req, res) => {
    try{
        const result = await pool.query('SELECT * FROM tasks');
        res.json(result.rows);
    }
    catch(error){
        console.log(error);
        res.status(500).send('server error. please retry.')
    }
    
});

// POST /tasks - Add a new task
app.post('/tasks', async (request, response) => {
    const { id, description, status } = request.body;
    if (!id || !description || !status) {
        return response.status(400).json({ error: 'All fields (id, description, status) are required' });
    }
    try{
        const result = await pool.query (
            'INSERT INTO tasks (description, status) VALUES ($1, $2) RETURNING *'
            [description, status]
        );
    tasks.push({ id, description, status });
    response.status(201).json({ message: 'Task added successfully' });
    }
    catch(error) {
        console.log(error);
        response.status(500).send('server error. please retry.')
    }
    
});

// PUT /tasks/:id - Update a task's status
app.put('/tasks/:id', async (request, response) => {
    const taskId = parseInt(request.params.id, 10);
    const { status } = request.body;

    try{
        const result = await pool.query(
            'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
            [status, taskId]
        );
        
        if (result.rows.length === 0) {
            return response.status(404).json({ error: 'Task not found' });
        }

        response.json({ message: 'Task updated successfully' });
    } 
    catch (error) { 
        console.log(error);
        response.status(500).send('server error. please retry.')
    }

    // const task = tasks.find(t => t.id === taskId);
    // if(task){
    //     task.status = status;
    // }
});

// DELETE /tasks/:id - Delete a task
app.delete('/tasks/:id', async (request, response) => {
    const taskId = parseInt(request.params.id, 10);

    try{
        const result = await pool.query(
            'DELETE FROM tasks WHERE id = $1 RETURNING *',
            [taskId]
        );
        if (result.rows.length === 0) {
            return response.status(404).json({ error: 'Task not found' });
        }
        response.json({ message: 'Task deleted successfully' });
    }
    catch(error) {
        console.log(error);
        response.status(500).send('server error. please retry.')
    }

    // const initialLength = tasks.length;
    // tasks = tasks.filter(t => t.id !== taskId); 
    
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
