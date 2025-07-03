import express from "express";
import bodyParser from "body-parser";
import process from "node:process";

import * as client from "./client.ts";

// Couldn't figure out how to make a REPL in TS. I guess you really can't do
// everything in javascript
const app = express();
app.use(bodyParser.json());

const PORT = Number.parseInt(process.argv[2]);

app.listen(PORT, () => {
  console.log(`client started on port ${PORT}...`)
});

app.post("/join", (req, res) => {
  client.join(req.body.username);
  res.send("^B");
});

app.post("/shoot", (req, res) => {
  const { x, y } = req.body;
  client.shootBullet(x, y);
  res.send("^B");
});

app.post("/move", (req, res) => {
  const { x, y } = req.body;
  client.moveTo(x, y);
  res.send("^B");
});
