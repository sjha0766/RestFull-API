import express from 'express';
import { APP_PORT,DB_URL} from './config';
import router from './routes';
import errorHandler from './middlewares/errorHandler';
import mongoose from 'mongoose';
import cors from 'cors';


mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});


let app = express();

app.use(express.json());
app.use('/api', router);
app.use('/uploads', express.static('uploads'));

// Mount the errorHandler middleware
app.use(errorHandler);

app.listen(APP_PORT, () => {
    console.log(`Listening on Port ${APP_PORT}`);
});
