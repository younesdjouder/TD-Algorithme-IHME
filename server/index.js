
const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const crypto = require("node:crypto");
const { promisify } = require("node:util");

const scryptAsync = promisify(crypto.scrypt);

async function hacherMotDePasse(motDePasse) {
    const sel = crypto.randomBytes(16);

    const empreinte = await scryptAsync(
        motDePasse,
        sel,
        64,
        {
            N: 131072,
            r: 8,
            p: 1,
            maxmem: 256 * 1024 * 1024
        }
        
async function verifierMotDePasse(motDePasse, hashStocke) {
    // Verifier le format des donnees
    if (
        typeof motDePasse !== "string" ||
        typeof hashStocke !== "string"
    ) {
        return false;
    }

    const parties = hashStocke.split(":");

    if (
        parties.length !== 6 ||
        parties[0] !== "scrypt" ||
        parties[1] !== "131072" ||
        parties[2] !== "8" ||
        parties[3] !== "1" ||
        !/^[0-9a-f]{32}$/.test(parties[4]) ||
        !/^[0-9a-f]{128}$/.test(parties[5])
    ) {
        return false;
    }

    const sel = Buffer.from(parties[4], "hex");
    const empreinteStockee = Buffer.from(parties[5], "hex");

    // Recalculer l'empreinte
    const empreinteCalculee = await scryptAsync(
        motDePasse,
        sel,
        64,
        {
            N: 131072,
            r: 8,
            p: 1,
            maxmem: 256 * 1024 * 1024
        }
    );

    // Comparer les empreintes
    return crypto.timingSafeEqual(
        empreinteCalculee,
        empreinteStockee
    );
}

    );

    return [
        "scrypt",
        "131072",
        "8",
        "1",
        sel.toString("hex"),
        empreinte.toString("hex")
    ].join(":");
}


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

/* =====================================
   INSCRIPTION DES UTILISATEURS
   ===================================== */

/* =====================================
   PROTECTION DES INSCRIPTIONS
   ===================================== */

const tentativesInscription = new Map();

function limiterInscriptions(req, res, next) {

    const maintenant = Date.now();
    const fenetre = 15 * 60 * 1000;
    const maximum = 5;

    const ip = req.ip || req.socket.remoteAddress;

    const historique = tentativesInscription.get(ip) || [];

    const tentativesRecentes = historique.filter(
        date => maintenant - date < fenetre
    );

    if (tentativesRecentes.length >= maximum) {
        tentativesInscription.set(ip, tentativesRecentes);

        return res.status(429).json({
            erreur: "Trop de tentatives. Reessayez plus tard."
        });
    }

    tentativesRecentes.push(maintenant);
    tentativesInscription.set(ip, tentativesRecentes);

    next();
}


app.post("/api/auth/inscription", limiterInscriptions, async (req, res) => {

    // Inscription desactivee tant que
    // les protections ne sont pas terminees
    if (process.env.ENABLE_REGISTRATION !== "true") {
        return res.status(503).json({
            erreur: "Inscription bientot disponible"
        });
    }

    const { pseudo, email, motDePasse } = req.body || {};

    // 1. Verifier les types
    if (
        typeof pseudo !== "string" ||
        typeof email !== "string" ||
        typeof motDePasse !== "string"
    ) {
        return res.status(400).json({
            erreur: "Informations invalides"
        });
    }

    // 2. Nettoyer les informations
    const pseudoPropre = pseudo.trim();
    const emailPropre = email.trim().toLowerCase();

    // 3. Verifier les longueurs et l'email
    if (
        pseudoPropre.length < 3 ||
        pseudoPropre.length > 50 ||
        emailPropre.length > 255 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPropre) ||
        motDePasse.length < 15 ||
        motDePasse.length > 128 ||
        Buffer.byteLength(motDePasse, "utf8") > 256
    ) {
        return res.status(400).json({
            erreur: "Pseudo, email ou mot de passe invalide"
        });
    }

    try {
        // 4. Hacher le mot de passe
        const empreinte = await hacherMotDePasse(motDePasse);

        // 5. Enregistrer dans PostgreSQL
        const reponse = await pool.query(
            `INSERT INTO utilisateurs
             (pseudo, email, mot_de_passe_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (email) DO NOTHING
             RETURNING id, pseudo, date_creation`,
            [pseudoPropre, emailPropre, empreinte]
        );

        // Reponse generique pour limiter
        // la divulgation des comptes existants
        return res.status(202).json({
            message: "Demande d'inscription traitee"
        });

    } catch (error) {
        console.error(
            "Erreur inscription :",
            error.message
        );

        return res.status(500).json({
            erreur: "Erreur lors de l'inscription"
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
