import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from "body-parser";
import { usersRouter } from './routers/users_router.js';

dotenv.config();

const PORT = 8000;
const app = express();

app.use(bodyParser.json());

app.use(cors());
app.use(express.json());
app.use("/api/users", usersRouter);

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});