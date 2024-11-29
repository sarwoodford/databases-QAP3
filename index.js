const express = require('express');
const app = express();
const PORT = 3000;
const pool = require('./db');

const mongoose = require('mongoose');

app.use(express.json());

const MONGO_URI = 'mongodb+srv://sarawoodford6:SaraMongo@qap3.gb0es.mongodb.net/';

mongoose.connect(MONGO_URI)
    .then(() => app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`)))
    .catch(err => console.error("Error connecting to MongoDB:", err));

// establish schema

const bookSchema = new mongoose.Scheme({
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true},
    genre: { type: String, required: true, trim: true},
    year: { type: Number, required: true, min: 1}
});

const Book = mongoose.model('Book', bookSchema);

// postgreSQL ( task 1 )

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

// let tasks = [
//     { id: 1, description: 'Buy groceries', status: 'incomplete' },
//     { id: 2, description: 'Read a book', status: 'complete' },
// ];

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
    const { description, status } = request.body; // removed id because the database generates one
    if (!description || !status) {
        return response.status(400).json({ error: 'All fields (description, status) are required' });
    }
    try{
        const result = await pool.query (
            'INSERT INTO tasks (description, status) VALUES ($1, $2) RETURNING *'
            [description, status]
        );
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

    
});

// mongoDB ( task 2 )

const insertBooks = async () => {
    const bookData = [
        { title: 'The Hobbit', author: 'JRR Tolkien', genre: 'Fantasy', year: 1937},
        { title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction', year: 1960},
        { title: '1984', authoe: 'George Orwell', genre: 'Dystopian', year: 1949}
    ];

    try{
        await Book.insertMany(bookData);
        console.log("Books Inserted Successfully")
    }
    catch ( error ){
        console.log('Error Inserting Books.');
    }
}

async function getBookTitles() {
    const titles = await Book.find({}, { title: 1, _id: 0});

    if (titles.length === 0) {
        console.log("No Books Available.")
    }
    else {
        console.log("All Book Titles: ");
        titles.forEach((book) => {
            console.log(book.title);
        });
    }
}

async function findBooksByAuthor() {
    const books = await Book.find({ author: authorName });

    if(books.length === 0) {
        console.log(`No Books Found By ${authorName}`);
    }
    else{
        console.log(`Books Written by ${authorName}: `)
        books.forEach((book) => {
            console.log(`Title: ${book.title} - Genre: ${book.genre} - Year: ${book.year}`);
        });
    }
}

async function updateBookGenre() {
    const result = await Book.updateOne({ title }, { set: { genre : updatedGenre }});

    if(result.matchedCount === 0) {
        console.log(`Book Not Found.`);
    }
    else {
        console.log(`Updated ${book.title} Genre to ${updatedGenre}`);
    }
}

async function deleteBook(title) {
    const result = await Book.deleteOne({ title });

    if(result.deletedCount > 0) {
        console.log(`Book "${result.title}" deleted`)
    }
    else{
        console.log(`Book Not Found.`)
    }
}

async function main() {
    const command = process.argv[2];
    switch(command) {

        case 'titles' : {
            await getBookTitles();
            break;
        }

        case 'find': {
            const authorName = process.argv[3];

            if(!authorName) {
                console.log('Usage: node index.js find <author_name>');
                break;
            }

            await findBooksByAuthor(authorName);
            break;
        }
        
        case 'update': {
            const title = process.argv[3];
            const updatedGenre = process.argv[4];
            
            if(!title || !updatedGenre) {
                console.log('Usage: node index.js find <author_name>');
                break;
            }

            await updateBookGenre(title, updatedGenre);
            break;
        }

        case 'delete': {
            const title = process.argv[3];

            if(!title) {
                console.log('Usage: node index.js find <author_name>');
                break;
            }

            await deleteBook(title);
            break;
        }

        default :
            console.log('Usage: node index.js <command> [argument(s)]');
            console.log('Commands: titles, find, update, delete');
    }
    mongoose.connection.close();
}

main().catch((error) => {
    console.error(error);
    mongoose.connection.close();
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
