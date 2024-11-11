require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 4000;

// Secure token from environment variable
const SECURE_TOKEN = process.env.SECURE_TOKEN;

// Middleware
app.use(bodyParser.text({ type: "text/plain", limit: "50mb" }));

// Function to check token
const checkToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (token === SECURE_TOKEN) {
        next();
    } else {
        res.status(401).json({ error: "Unauthorized" });
    }
};

// Get Endpoint
app.get("/", (req, res) => {
    res.send("Uplifted Render Server Up and running");
});

// Execute endpoint
app.post("/execute", checkToken, (req, res) => {
    const code = req.body;
    if (!code) {
        return res.status(400).json({ error: "No code provided" });
    }

    try {
        // Execute the code
        const result = eval(code);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message, trace: error.stack });
    }
});

// POST /scrape endpoint for scraping with Puppeteer
app.post("/scrape", checkToken, async (req, res) => {
    let code = req.body;
    const timeout = parseInt(req.query.timeout) || 120000;

    console.log("Raw received code:", code);
    console.log("Code type:", typeof code);
    console.log("Code length:", code.length);

    if (!code) {
        return res.status(400).json({ error: "No code provided" });
    }

    try {
        if (typeof code !== 'string') {
            code = JSON.stringify(code);
        }
        code = code.trim();
        console.log("Processed code:", code);

        // --> Modified to properly wait for the result
        const scrapeResult = await new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Scraping operation timed out'));
            }, timeout);

            eval(`(async () => {
                try {
                    ${code}
                    const result = await getHeyReachAuthHeader(email, password);
                    clearTimeout(timer);
                    resolve(result);
                } catch (error) {
                    clearTimeout(timer);
                    reject(error);
                }
            })();`);
        });

        console.log("Scrape result:", scrapeResult);
        return res.json({ result: scrapeResult });

    } catch (error) {
        console.error("Error in /scrape endpoint:", error.message);
        console.error("Error stack:", error.stack);
        return res.status(500).json({ 
            error: error.message, 
            trace: error.stack
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
