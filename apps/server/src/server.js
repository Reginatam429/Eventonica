import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));

// to check im in the correct database(temporarily)
console.log('API DB =>', process.env.DATABASE_URL);

