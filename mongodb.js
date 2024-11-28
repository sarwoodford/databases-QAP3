const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/library'

mongoose.connect(MONGO_URI)
    .then(() => app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`)))
    .catch(err => console.error("Error connecting to MongoDB:", err));