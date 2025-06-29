import express from "express";
import bodyParser from "body-parser";

import * as client from "./client.ts";

// Couldn't figure out how to make a REPL in TS. I guess you really can't do
// everything in javascript
const app = express();
app.use(bodyParser.json());

app.listen(3000, () => {
  console.log("server started ...")
});

app.post("/join", (req, res) => {
  client.join(req.body.username);
  res.send("");
});
