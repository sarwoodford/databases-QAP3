const { Pool } = require('pg');

// new pg pool
const pool = new Pool({
    user: 'sara',
    host: 'localhost',
    database: 'task_manager',
    password: 'sara',
    port: 5432,
});

module.exports = pool;

// make sure database connects 
//(tested before and after creating on pgAdmin to ensure connection works)
if (require.main === module){
    (async () => {
        try{
            const res = await pool.query('SELECT NOW()');
            console.log("connected");
        }catch(err){
            console.log("error");
        } finally{
            pool.end();
        }
    })();
}