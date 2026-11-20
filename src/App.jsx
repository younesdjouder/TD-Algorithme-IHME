
import React, { useState, useEffect } from "react";

// Chemin de l'API, compatible avec le serveur IHME
const API_URL = import.meta.env.BASE_URL + "api/matchs";

function App() {
    // Les matchs seront charges depuis PostgreSQL
    const [matchs, setMatchs] = useState([]);

    // Informations saisies dans le formulaire
    const [adversaire, setAdversaire] = useState("");
    const [surface, setSurface] = useState("Dur");
    const [resultat, setResultat] = useState("Victoire");
    const [score, setScore] = useState("");

    // Etats pour informer l'utilisateur
    const [chargement, setChargement] = useState(true);
    const [enregistrement, setEnregistrement] = useState(false);
    const [erreur, setErreur] = useState("");

    // Charger les matchs lors de l'ouverture de la page
    useEffect(() => {
        let actif = true;

        async function chargerMatchs() {
            try {
                const reponse = await fetch(API_URL);

                if (!reponse.ok) {
                    throw new Error("Erreur de chargement");
                }

                const donnees = await reponse.json();

                if (actif) {
                    setMatchs(donnees);
                }
            } catch (error) {
                if (actif) {
                    setErreur("Impossible de charger les matchs.");
                }
            } finally {
                if (actif) {
                    setChargement(false);
                }
            }
        }

        chargerMatchs();

        return () => {
            actif = false;
        };
    }, []);

    // Statistiques calculees automatiquement
    const total = matchs.length;

    const victoires = matchs.filter(
        match => match.resultat === "Victoire"
    ).length;

    const defaites = total - victoires;

    const taux = total > 0
        ? Math.round((victoires / total) * 100)
        : 0;

    // Enregistrer un match dans PostgreSQL
    async function ajouterMatch(event) {
        event.preventDefault();

        if (!adversaire.trim() || enregistrement) {
            return;
        }

        setErreur("");
        setEnregistrement(true);

        try {
            const reponse = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                
body: JSON.stringify({
    adversaire: adversaire.trim(),
    surface: surface,
    resultat: resultat,
    score: score.trim()
})

            });

            if (!reponse.ok) {
                throw new Error("Erreur d'enregistrement");
            }

            const nouveauMatch = await reponse.json();

            // Actualiser le tableau et les statistiques
            setMatchs(anciensMatchs => [
                nouveauMatch,
                ...anciensMatchs
            ]);

            setAdversaire("");
            setScore("");
        } catch (error) {
            setErreur("Impossible d'enregistrer le match.");
        } finally {
            setEnregistrement(false);
        }
    }

    return (
        <main>

            
<nav className="navbar" aria-label="Navigation principale">
    <a href="#accueil" className="navbar-logo">
        <span className="logo-icon">●</span>
        <span>AceMetrics</span>
    </a>

    <div className="navbar-links">
        <a href="#dashboard">Tableau de bord</a>
        <a href="#historique">Mes matchs</a>
        <a href="#ajouter-match" className="nav-button">
            + Ajouter un match
            
<a href="#connexion" className="nav-button">
    Connexion
</a>

        </a>
    </div>
</nav>

<header className="hero" id="accueil">
    <div className="hero-content">
        <span className="hero-label">
            TENNIS PERFORMANCE ANALYTICS
        </span>

        <h1>AceMetrics</h1>

        <h2>Chaque match raconte une histoire.</h2>

        <p>
            Analyse tes résultats, suis tes performances
            et progresse match après match.
        </p>

        <a href="#ajouter-match" className="hero-button">
            + Ajouter un match
        </a>
    </div>
</header>


            <section id="dashboard">
                <h2>Vue d'ensemble</h2>

                <div className="stats">
                    <article className="card">
                        <h2>Matchs joués</h2>
                        <p>{total}</p>
                    </article>

                    <article className="card">
                        <h2>Victoires</h2>
                        <p>{victoires}</p>
                    </article>

                    <article className="card">
                        <h2>Défaites</h2>
                        <p>{defaites}</p>
                    </article>

                    <article className="card">
                        <h2>Taux de victoire</h2>
                        <p>{taux} %</p>
                    </article>
                </div>
            </section>

        <section className="card" id="ajouter-match">
                <h2>Ajouter un match</h2>

                <form onSubmit={ajouterMatch}>
                    <label htmlFor="adversaire">
                        Adversaire
                    </label>
                    <input
                        id="adversaire"
                        type="text"
                        maxLength={100}
                        value={adversaire}
                        onChange={event =>
                            setAdversaire(event.target.value)
                        }
                        placeholder="Nom de l'adversaire"
                        required
                    />

                    <label htmlFor="surface">Surface</label>
                    <select
                        id="surface"
                        value={surface}
                        onChange={event =>
                            setSurface(event.target.value)
                        }
                    >
                        <option value="Dur">Dur</option>
                        <option value="Terre battue">Terre battue</option>
                        <option value="Gazon">Gazon</option>
                    </select>

                    
<label htmlFor="score">Score du match</label>

<input
    id="score"
    type="text"
    value={score}
    onChange={event => setScore(event.target.value)}
    placeholder="Ex : 6-4, 3-6, 7-5"
    maxLength={100}
    required
/>

                    <label htmlFor="resultat">Résultat</label>
                    <select
                        id="resultat"
                        value={resultat}
                        onChange={event =>
                            setResultat(event.target.value)
                        }
                    >
                        <option value="Victoire">Victoire</option>
                        <option value="Défaite">Défaite</option>
                    </select>

                    <button type="submit" disabled={enregistrement}>
                        {enregistrement
                            ? "Enregistrement..."
                            : "Ajouter le match"}
                    </button>
                </form>

                {erreur && <p role="alert">{erreur}</p>}
            </section>
            
<section className="card performance-card">
    <div className="performance-header">
        <div>
            <span className="performance-label">
                ANALYSE DES PERFORMANCES
            </span>
            <h2>Répartition des résultats</h2>
        </div>
    </div>

    <div className="performance-content">
        <div
            className="donut-chart"
            style={{
                background: total > 0
                    ? `conic-gradient(
                        #c9f35b 0% ${taux}%,
                        #60786a ${taux}% 100%
                    )`
                    : "#35463d"
            }}
            role="img"
            aria-label={`${taux}% de victoires`}
        >
            <div className="donut-center">
                <strong>{taux}%</strong>
                <span>de victoires</span>
            </div>
        </div>

        <div className="performance-details">
            <div className="performance-item">
                <span>🟢 Victoires</span>
                <strong>{victoires}</strong>
            </div>

            <div className="performance-item">
                <span>⚪ Défaites</span>
                <strong>{defaites}</strong>
            </div>

            <p>{total} matchs analysés</p>
        </div>
    </div>
</section>


          <section id="historique">
                <h2>Historique des matchs</h2>

                {chargement ? (
                    <p>Chargement des matchs...</p>
                ) : (
                    <table>
                        <thead>
                            
<tr>
    <th>Adversaire</th>
    <th>Surface</th>
    <th>Score</th>
    <th>Résultat</th>
</tr>

                        </thead>
                        <tbody>
                            {matchs.map(match => (
                                <tr key={match.id}>
                                    <td>{match.adversaire}</td>
                                    <td>{match.surface}</td>
                                    <td>{match.score || "Non renseigné"}</td>
                                    <td className={
                                        match.resultat === "Victoire"
                                            ? "victoire"
                                            : "defaite"
                                    }>
                                        {match.resultat}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {!chargement && matchs.length === 0 && !erreur && (
                    <p>Aucun match enregistré pour le moment.</p>
                )}

                <p>Données fictives de démonstration.</p>
            </section>
            
<section className="card" id="connexion">
    <h2>Connexion à AceMetrics</h2>

    <p>
        Retrouve prochainement ton espace personnel,
        tes matchs et tes statistiques.
    </p>

    <form onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="email">Adresse e-mail</label>
        <input
            id="email"
            type="email"
            placeholder="joueur@exemple.com"
            autoComplete="email"
            disabled
        />

        <label htmlFor="motdepasse">Mot de passe</label>
        <input
            id="motdepasse"
            type="password"
            placeholder="Mot de passe"
            autoComplete="current-password"
            disabled
        />

        <button type="button" disabled>
            Se connecter
        </button>
    </form>

    <p>
        Fonctionnalité en préparation.
        Aucun compte réel ne peut encore être créé.
    </p>
</section>

        </main>
    );
}

export default App;
