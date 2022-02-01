import express from "express";
import path from "path";
import fetch from 'node-fetch';
import {fileURLToPath} from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from "dotenv";
dotenv.config();
const PORT = process.env.PORT || 4000;

const get_pexels_data = async url => {
    var response = false;
    var treatedResponse;
    try {
        response = await fetch(url, {
            headers: {
                Authorization: process.env.API_KEY
            }
        });
        treatedResponse = await response.json();
    } catch (err) { // If there was some server error
        return "error";
    }
    const resultsCount = treatedResponse.page * treatedResponse.per_page;
    if (treatedResponse.total_results === 0 || resultsCount > treatedResponse.total_results) // If there are no results
        return false;
    return treatedResponse;
};


app.use(express.static(`${__dirname}/public`));
app.use(express.json());

app.post('/', async (req, res) => {
    const data = await get_pexels_data(req.body.url);
    res.json({"response": data});
});

app.listen(PORT, (req, res) => {
    console.log("Server running");
});