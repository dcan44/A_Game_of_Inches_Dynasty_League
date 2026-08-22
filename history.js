const historySeasonSelect =
    document.getElementById(
        'history-season-select'
    );


const historySeasonContent =
    document.getElementById(
        'history-season-content'
    );


const historyChampions =
    document.getElementById(
        'history-champions'
    );


/*
 * ======================================================
 * CONFIRMED CHAMPIONS
 * ======================================================
 */

const confirmedChampions = {

    2023: {
        owner_id:
            "978544154789699584",
        owner:
            "dcan44",
        owner_name:
            "Dan",
        team_name:
            "Rollin with Ma-Homies"
    },

    2024: {
        owner_id:
            "978815135223525376",
        owner:
            "RJ196",
        owner_name:
            "RJ",
        team_name:
            "Goats"
    },

    2025: {
        owner_id:
            "1060373241799262208",
        owner:
            "ChefBoySJ",
        owner_name:
            "Seth",
        team_name:
            "Big Dog"
    }

};



/*
 * ======================================================
 * LOAD CHAMPION PENNANTS
 * ======================================================
 */

function loadChampionPennants() {

    historyChampions.innerHTML = '';


    Object.entries(
        confirmedChampions
    ).forEach(
        ([year, champion]) => {

            const pennant =
                document.createElement(
                    'div'
                );


            pennant.className =
                'history-champion-pennant';


            pennant.innerHTML = `

                <div class="history-pennant-year">
                    ${year}
                </div>

                <div class="history-pennant-trophy">
                    ★
                </div>

                <div class="history-pennant-title">
                    Champion
                </div>

                <div class="history-pennant-team">
                    ${champion.team_name}
                </div>

                <div class="history-pennant-owner">
                    ${champion.owner_name}
                </div>

            `;


            historyChampions.appendChild(
                pennant
            );

        }
    );

}



/*
 * ======================================================
 * LOAD ONE SEASON
 * ======================================================
 */

async function loadHistorySeason(
    season
) {

    try {

        historySeasonContent.innerHTML =
            'Loading season history...';


        const leagueIds = {

            2023:
                "978545340355862528",

            2024:
                "1050836306860957696",

            2025:
                "1181097603123351552"

        };


        const leagueId =
            leagueIds[
                season
            ];


        const [
            historyResponse,
            performanceResponse,
            bracketResponse
        ] = await Promise.all([

            fetch('/api/history'),

            fetch(
                `/api/manager-performance?season=${season}`
            ),

            fetch(
                `https://api.sleeper.app/v1/league/${leagueId}/winners_bracket`
            )

        ]);


        if (
            !historyResponse.ok ||
            !performanceResponse.ok ||
            !bracketResponse.ok
        ) {

            throw new Error(
                'Unable to retrieve season history.'
            );

        }


        const historyData =
            await historyResponse.json();


        const performanceData =
            await performanceResponse.json();


        const bracketData =
            await bracketResponse.json();


        /*
         * =====================================================
         * FIND SEASON
         * =====================================================
         */

        const seasonData =
            historyData.seasons.find(
                item =>
                    Number(
                        item.season
                    ) ===
                    Number(
                        season
                    )
            );


        if (!seasonData) {

            throw new Error(
                'Season not found.'
            );

        }


        /*
         * =====================================================
         * ROSTER LOOKUP
         * =====================================================
         */

        const rosterMap = {};


        seasonData.teams.forEach(
            team => {

                rosterMap[
                    team.roster_id
                ] = team;

            }
        );


        /*
         * =====================================================
         * CHAMPIONSHIP / THIRD PLACE
         * =====================================================
         */

        const championshipGame =
            bracketData.find(
                game =>
                    game.p === 1
            );


        const thirdPlaceGame =
            bracketData.find(
                game =>
                    game.p === 3
            );


        const champion =
            championshipGame
                ? rosterMap[
                    championshipGame.w
                  ]
                : null;


        const runnerUp =
            championshipGame
                ? rosterMap[
                    championshipGame.l
                  ]
                : null;


        const thirdPlace =
            thirdPlaceGame
                ? rosterMap[
                    thirdPlaceGame.w
                  ]
                : null;


        /*
         * =====================================================
         * REGULAR-SEASON LEADERS
         * =====================================================
         */

        const managers =
            performanceData.managers || [];


        const mostWins =
            [...managers]
                .sort(
                    (a, b) =>
                        b.regular_season.wins -
                        a.regular_season.wins
                )[0];


        const highestPPG =
            [...managers]
                .filter(
                    manager =>
                        manager.regular_season.games > 0
                )
                .sort(
                    (a, b) =>
                        b.scoring.points_per_game -
                        a.scoring.points_per_game
                )[0];


        const highestTeamScore =
            [...managers]
                .filter(
                    manager =>
                        manager.highest_team_score
                )
                .sort(
                    (a, b) =>
                        b.highest_team_score.points -
                        a.highest_team_score.points
                )[0];


        /*
         * =====================================================
         * FINAL STANDINGS
         * =====================================================
         *
         * This first version ranks by regular-season record.
         * Playoff podium is shown separately above.
         */

        const standings =
            [...seasonData.teams]
                .sort(
                    (a, b) => {

                        if (
                            b.wins !==
                            a.wins
                        ) {

                            return (
                                b.wins -
                                a.wins
                            );

                        }


                        if (
                            a.losses !==
                            b.losses
                        ) {

                            return (
                                a.losses -
                                b.losses
                            );

                        }


                        return (
                            b.points_for -
                            a.points_for
                        );

                    }
                );


        /*
         * =====================================================
         * BUILD PAGE
         * =====================================================
         */

        historySeasonContent.innerHTML = `

            <div class="history-season-header">

                <span>
                    ${season} Season
                </span>

                <h2>
                    ${confirmedChampions[season]?.team_name || 'Season Archive'}
                </h2>

                <p>
                    League Champion
                </p>

            </div>


            <div class="history-podium">

                <div class="history-podium-card champion">

                    <span>
                        Champion
                    </span>

                    <strong>
                        ${
                            champion
                                ? champion.team_name
                                : confirmedChampions[season]?.team_name || '—'
                        }
                    </strong>

                    <small>
                        ${
                            champion
                                ? champion.owner
                                : confirmedChampions[season]?.owner_name || '—'
                        }
                    </small>

                </div>


                <div class="history-podium-card">

                    <span>
                        Runner-Up
                    </span>

                    <strong>
                        ${
                            runnerUp
                                ? runnerUp.team_name
                                : '—'
                        }
                    </strong>

                    <small>
                        ${
                            runnerUp
                                ? runnerUp.owner
                                : '—'
                        }
                    </small>

                </div>


                <div class="history-podium-card">

                    <span>
                        Third Place
                    </span>

                    <strong>
                        ${
                            thirdPlace
                                ? thirdPlace.team_name
                                : '—'
                        }
                    </strong>

                    <small>
                        ${
                            thirdPlace
                                ? thirdPlace.owner
                                : '—'
                        }
                    </small>

                </div>

            </div>


            <h3 class="history-subtitle">
                Season Leaders
            </h3>


            <div class="history-leaders-grid">

                ${leaderCard(
                    'Most Wins',
                    mostWins
                        ? mostWins.regular_season.wins
                        : '—',
                    mostWins
                        ? mostWins.owner
                        : '—'
                )}


                ${leaderCard(
                    'Highest PPG',
                    highestPPG
                        ? highestPPG.scoring.points_per_game.toFixed(2)
                        : '—',
                    highestPPG
                        ? highestPPG.owner
                        : '—'
                )}


                ${leaderCard(
                    'Highest Team Score',
                    highestTeamScore
                        ? highestTeamScore.highest_team_score.points.toFixed(2)
                        : '—',
                    highestTeamScore
                        ? `${highestTeamScore.owner} • Week ${highestTeamScore.highest_team_score.week}`
                        : '—'
                )}

            </div>


            <h3 class="history-subtitle">
                Regular-Season Standings
            </h3>


            <div class="records-table-card">

                <div class="records-table-scroll">

                    <table class="history-standings-table">

                        <thead>

                            <tr>
                                <th>Rank</th>
                                <th>Team</th>
                                <th>Manager</th>
                                <th>Record</th>
                                <th>PF</th>
                            </tr>

                        </thead>

                        <tbody>

                            ${standings.map(
                                (team, index) => `
                                    <tr>

                                        <td>
                                            ${index + 1}
                                        </td>

                                        <td class="history-team-name">
                                            ${team.team_name}
                                        </td>

                                        <td>
                                            ${team.owner}
                                        </td>

                                        <td>
                                            ${formatRecord(
                                                team.wins,
                                                team.losses,
                                                team.ties
                                            )}
                                        </td>

                                        <td>
                                            ${Number(
                                                team.points_for || 0
                                            ).toFixed(2)}
                                        </td>

                                    </tr>
                                `
                            ).join('')}

                        </tbody>

                    </table>

                </div>

            </div>


            <div class="history-draft-link">

                <a href="/draft">
                    View ${season} Draft Archive →
                </a>

            </div>

        `;


    } catch (
        error
    ) {

        console.error(
            'History error:',
            error
        );


        historySeasonContent.innerHTML = `

            <div class="draft-error">
                Unable to load season history.
            </div>

        `;

    }

}



/*
 * ======================================================
 * LEADER CARD
 * ======================================================
 */

function leaderCard(
    label,
    value,
    detail
) {

    return `

        <div class="league-record-card">

            <span class="league-record-label">
                ${label}
            </span>

            <strong class="league-record-value">
                ${value}
            </strong>

            <span class="league-record-holder">
                ${detail}
            </span>

        </div>

    `;

}



/*
 * ======================================================
 * FORMAT RECORD
 * ======================================================
 */

function formatRecord(
    wins,
    losses,
    ties
) {

    let record =
        `${wins}-${losses}`;


    if (
        ties &&
        ties > 0
    ) {

        record +=
            `-${ties}`;

    }


    return record;

}



/*
 * ======================================================
 * SEASON SELECT
 * ======================================================
 */

historySeasonSelect.addEventListener(
    'change',
    event => {

        loadHistorySeason(
            Number(
                event.target.value
            )
        );

    }
);



/*
 * ======================================================
 * INITIAL LOAD
 * ======================================================
 */

loadChampionPennants();

loadHistorySeason(
    Number(
        historySeasonSelect.value
    )
);
