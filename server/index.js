
const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================
// 1. CONNEXION POSTGRESQL
// =====================================

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4,
    connectionTimeoutMillis: 5000
});

app.use(express.json());

// =====================================
// 2. VERIFICATION DE SANTE
// =====================================

app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            status: "ok",
            application: "AceMetrics"
        });
    } catch (error) {
        console.error("Erreur PostgreSQL :", error.message);

        res.status(503).json({
            status: "unavailable"
        });
    }
});

// =====================================
// 3. INITIALISATION DE LA BASE
// =====================================

async function initialiserBase() {

    // Creer la table si elle n'existe pas
    await pool.query(`
        CREATE TABLE IF NOT EXISTS matchs (
            id SERIAL PRIMARY KEY,
            adversaire VARCHAR(100) NOT NULL,
            surface VARCHAR(30) NOT NULL,
            resultat VARCHAR(20) NOT NULL,
            CONSTRAINT matchs_surface_check
                CHECK (surface IN (
                    'Dur', 'Terre battue', 'Gazon'
                )),
            CONSTRAINT matchs_resultat_check
                CHECK (resultat IN (
                    'Victoire', 'Défaite'
                ))
        )
    `);

    // Ajouter le score sans effacer les matchs
    await pool.query(`
        ALTER TABLE matchs
        ADD COLUMN IF NOT EXISTS score VARCHAR(100)
    `);
    
    // =====================================
    // CREATION DE LA TABLE UTILISATEURS
    // =====================================

    await pool.query(`
        CREATE TABLE IF NOT EXISTS utilisateurs (
            id SERIAL PRIMARY KEY,
            pseudo VARCHAR(50) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            mot_de_passe_hash TEXT NOT NULL,
            date_creation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log("Table utilisateurs initialisee");


    console.log("Base PostgreSQL initialisee");
}

// =====================================
// 4. RECUPERER LES MATCHS
// =====================================

app.get("/api/matchs", async (req, res) => {
    try {
        const reponse = await pool.query(
            "SELECT * FROM matchs ORDER BY id DESC"
        );

        res.json(reponse.rows);
    } catch (error) {
        console.error("Erreur lecture :", error.message);

        res.status(500).json({
            erreur: "Impossible de recuperer les matchs"
        });
    }
});

// =====================================
// 5. AJOUTER UN MATCH
// =====================================

app.post("/api/matchs", async (req, res) => {

    const {
        adversaire,
        surface,
        resultat,
        score
    } = req.body || {};

    const surfaces = [
        "Dur",
        "Terre battue",
        "Gazon"
    ];

    const resultats = [
        "Victoire",
        "Défaite"
    ];

    // Verification des informations
    if (
        typeof adversaire !== "string" ||
        adversaire.trim().length === 0 ||
        adversaire.trim().length > 100 ||
        !surfaces.includes(surface) ||
        !resultats.includes(resultat) ||
        typeof score !== "string" ||
        score.trim().length === 0 ||
        score.trim().length > 100
    ) {
        return res.status(400).json({
            erreur: "Informations du match invalides"
        });
    }

    try {
        const reponse = await pool.query(
            `INSERT INTO matchs
             (adversaire, surface, resultat, score)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                adversaire.trim(),
                surface,
                resultat,
                score.trim()
            ]
        );

        res.status(201).json(reponse.rows[0]);

    } catch (error) {
        console.error("Erreur ajout :", error.message);

        res.status(500).json({
            erreur: "Impossible d'enregistrer le match"
        });
    }
});

// =====================================
// 6. APPLICATION REACT
// =====================================

const distPath = path.join(__dirname, "../dist");

// Servir les fichiers React compiles
app.use(express.static(distPath));

// Page principale
app.get("/", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
});

// =====================================
// 7. DEMARRAGE DU SERVEUR
// =====================================

async function demarrerServeur() {
    try {
        // Initialiser PostgreSQL avant
        // d'accepter les requetes
        await initialiserBase();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(
                `AceMetrics demarre sur le port ${PORT}`
            );
        });

    } catch (error) {
        console.error(
            "Erreur au demarrage :",
            error.message
        );

        process.exit(1);
    }
}

demarrerServeur();
