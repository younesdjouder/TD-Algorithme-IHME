
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


/* Creation de la table si elle n'existe pas */

async function initialiserBase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS matchs (
            id SERIAL PRIMARY KEY,
            adversaire VARCHAR(100) NOT NULL,
            surface VARCHAR(30) NOT NULL,
            resultat VARCHAR(20) NOT NULL
                   CHECK (surface IN ('Dur', 'Terre battue', 'Gazon')),
            CHECK (resultat IN ('Victoire', 'Défaite'))
        )
    `);

    await pool.query(`
        ALTER TABLE matchs
        ADD COLUMN IF NOT EXISTS score VARCHAR(100)
    `);
}

initialiserBase().catch(error => {
    console.error(
        "Erreur initialisation PostgreSQL :",
        error.message
    );
});

/* Recuperer tous les matchs */

app.get("/api/matchs", async (req, res) => {
    try {
        const resultat = await pool.query(
            "SELECT * FROM matchs ORDER BY id DESC"
        );

        res.json(resultat.rows);
    } catch (error) {
        console.error("Erreur lecture matchs :", error.message);
        res.status(500).json({
            erreur: "Impossible de recuperer les matchs"
        });
    }
});

/* Ajouter un nouveau match */

app.post("/api/matchs", async (req, res) => {
    const { adversaire, surface, resultat, score } = req.body || {};

    const surfaces = ["Dur", "Terre battue", "Gazon"];
    const resultats = ["Victoire", "Défaite"];

    if (
        typeof adversaire !== "string" ||
        adversaire.trim().length === 0 ||
        adversaire.trim().length > 100 ||
        !surfaces.includes(surface) ||
        !resultats.includes(resultat)
        typeof score !== "string" ||
!/^([0-7]-[0-7])(\s*,\s*[0-7]-[0-7]){1,4}$/.test(score.trim()) ||
    ) {
        return res.status(400).json({
            erreur: "Informations du match invalides"
        });
    }

    try {
        
const reponse = await pool.query(
    `INSERT INTO matchs (adversaire, surface, resultat, score)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [adversaire.trim(), surface, resultat, score.trim()]
);


        res.status(201).json(reponse.rows[0]);
    } catch (error) {
        console.error("Erreur ajout match :", error.message);
        res.status(500).json({
            erreur: "Impossible d'enregistrer le match"
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
