
const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const BASE_PATH = (
    process.env.BASE_PATH || "/td-algorithme-ihme-p06/"
).replace(/\/?$/, "/");

const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 4
    })
    : null;

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        application: "AceMetrics"
    });
});

const distPath = path.join(__dirname, "../dist");

app.use(BASE_PATH, express.static(distPath));

app.get(BASE_PATH, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`AceMetrics demarre sur le port ${PORT}`);
});
