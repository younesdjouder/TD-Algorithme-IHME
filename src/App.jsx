
import React from "react";

function App() {
    const matchs = [
        { id: 1, adversaire: "Joueur A", surface: "Terre battue", resultat: "Victoire" },
        { id: 2, adversaire: "Joueur B", surface: "Dur", resultat: "Défaite" },
        { id: 3, adversaire: "Joueur C", surface: "Gazon", resultat: "Victoire" }
    ];

    const total = matchs.length;
    const victoires = matchs.filter(
        match => match.resultat === "Victoire"
    ).length;
    const defaites = total - victoires;
    const taux = total > 0
        ? Math.round((victoires / total) * 100)
        : 0;

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
                                <td>{match.resultat}</td>
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
