const express = require("express");
const app = express();
const path = require("path");
const PORT = process.env.PORT || 4000;

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/public/index.html`);
});

app.use(express.static(`${__dirname}/public`));

app.listen(PORT, (req, res) => {
    console.log("Listening to you");
});