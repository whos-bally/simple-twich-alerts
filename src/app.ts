const express = require('express');
const dotenv= require('dotenv');
const app = express();
const port = 3000;
const rootDir:string = 'E:\\Coding\\Programming Projects\\twitch_alerts\\';

dotenv.config({path: rootDir + '\\src\\.env'});

// check env variables exist
let client_id: string = process.env.CLIENT_ID!;

// express setup
app.get('/', (req: any, res: any) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`[INFO] Express app listening on port ${port}`)
})

if (client_id.length == 30)
  console.log("[SUCCESS] Client ID read from env");
else
  console.log("[WARN] Something ain't right man... ")