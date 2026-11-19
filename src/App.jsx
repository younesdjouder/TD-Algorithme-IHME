
import React, { useState } from "react";

function App() {

    // Liste initiale de matchs fictifs
    const [matchs, setMatchs] = useState([
        { id: 1, adversaire: "Joueur A", surface: "Terre battue", resultat: "Victoire" },
        { id: 2, adversaire: "Joueur B", surface: "Dur", resultat: "Défaite" },
        { id: 3, adversaire: "Joueur C", surface: "Gazon", resultat: "Victoire" }
    ]);

    // Informations du formulaire
    const [adversaire, setAdversaire] = useState("");
    const [surface, setSurface] = useState("Dur");
    const [resultat, setResultat] = useState("Victoire");

    // Calcul automatique des statistiques
    const total = matchs.length;

    const victoires = matchs.filter(
        match => match.resultat === "Victoire"
    ).length;

    const defaites = total - victoires;

    const taux = total > 0
        ? Math.round((victoires / total) * 100)
        : 0;

    // Fonction appelée lors de l'ajout d'un match
    function ajouterMatch(event) {
        event.preventDefault();

        if (adversaire.trim() === "") {
            return;
        }

        const nouveauMatch = {
            id: Date.now(),
            adversaire: adversaire.trim(),
            surface: surface,
            resultat: resultat
        };

        setMatchs(anciensMatchs => [
            ...anciensMatchs,
            nouveauMatch
        ]);

        setAdversaire("");
    }

    return (
        <main>
            <header>
                <div>
                    <h1>AceMetrics</h1>
                    <p>Tableau de bord de performance au tennis</p>
                </div>
            </header>

            <section>
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

            <section className="card">
                <h2>Ajouter un match</h2>

                <form onSubmit={ajouterMatch}>
                    <label htmlFor="adversaire">
                        Adversaire
                    </label>

                    <input
                        id="adversaire"
                        type="text"
                        value={adversaire}
                        onChange={event =>
                            setAdversaire(event.target.value)
                        }
                        placeholder="Nom de l'adversaire"
                        required
                    />

                    <label htmlFor="surface">
                        Surface
                    </label>

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

                    <label htmlFor="resultat">
                        Résultat
                    </label>

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

                    <button type="submit">
                        Ajouter le match
                    </button>
                </form>
            </section>

            <section>
                <h2>Historique des matchs</h2>

                <table>
                    <thead>
                        <tr>
                            <th>Adversaire</th>
                            <th>Surface</th>
                            <th>Résultat</th>
                        </tr>
                    </thead>

                    <tbody>
                        {matchs.map(match => (
                            <tr key={match.id}>
                                <td>{match.adversaire}</td>
                                <td>{match.surface}</td>
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

                <p>Données fictives de démonstration.</p>
            </section>
        </main>
    );
}

export default App;
