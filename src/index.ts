import dotenv from "dotenv";
dotenv.config({"path": "./.env"});

import express from 'express';
import cookieParser from "cookie-parser";
import authRouter from './routes/auth';
import pagesRouter from './routes/pages';


const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRouter);

app.use('/pages', pagesRouter);

if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

export default app;
