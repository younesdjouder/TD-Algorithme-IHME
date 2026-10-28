
const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// Connexion a PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4
});

app.use(express.json());

// Verification de l'API et de la base de donnees
app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            status: "ok",
            application: "AceMetrics"
        });
    } catch (error) {
        res.status(503).json({
            status: "unavailable"
        });
    }
});

// Dossier contenant React compile
const distPath = path.join(__dirname, "../dist");

app.use(express.static(distPath));

// Page d'accueil
app.get("/", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
});

// Demarrage du serveur
app.listen(PORT, "0.0.0.0", () => {
    console.log(`AceMetrics demarre sur le port ${PORT}`);
});
