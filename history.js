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


const hallOfShame =
    document.getElementById(
        'hall-of-shame'
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


const mostWinsRecord =
    Math.max(
        ...managers.map(
            manager =>
                manager.regular_season.wins
        )
    );


const mostWinsLeaders =
    managers.filter(
        manager =>
            manager.regular_season.wins ===
            mostWinsRecord
    );


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

    <div class="history-podium-card history-podium-champion">

        <div class="history-podium-icon">
            🏆
        </div>

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


    <div class="history-podium-card history-podium-runnerup">

        <div class="history-podium-icon">
            🏆
        </div>

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


    <div class="history-podium-card history-podium-third">

        <div class="history-podium-icon">
            🏆
        </div>

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
    mostWinsRecord >= 0
        ? mostWinsRecord
        : '—',
    mostWinsLeaders.length > 0
        ? mostWinsLeaders
            .map(
                manager =>
                    manager.owner
            )
            .join(' • ')
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
 * HALL OF SHAME
 * ======================================================
 *
 * In a 12-team league, the losers-bracket game with
 * p === 5 determines 11th and 12th place.
 *
 * The LOSER of that game is the final-place finisher.
 */

async function loadHallOfShame() {

    try {

        const leagueIds = {

            2023:
                "978545340355862528",

            2024:
                "1050836306860957696",

            2025:
                "1181097603123351552"

        };


        /*
         * Load league history plus each consolation bracket.
         */

        const [
            historyResponse,
            bracket2023Response,
            bracket2024Response,
            bracket2025Response
        ] = await Promise.all([

            fetch('/api/history'),

            fetch(
                `https://api.sleeper.app/v1/league/${leagueIds[2023]}/losers_bracket`
            ),

            fetch(
                `https://api.sleeper.app/v1/league/${leagueIds[2024]}/losers_bracket`
            ),

            fetch(
                `https://api.sleeper.app/v1/league/${leagueIds[2025]}/losers_bracket`
            )

        ]);


        if (!historyResponse.ok) {

            throw new Error(
                'Unable to retrieve league history.'
            );

        }


        const historyData =
            await historyResponse.json();


        const brackets = {

            2023:
                bracket2023Response.ok
                    ? await bracket2023Response.json()
                    : [],

            2024:
                bracket2024Response.ok
                    ? await bracket2024Response.json()
                    : [],

            2025:
                bracket2025Response.ok
                    ? await bracket2025Response.json()
                    : []

        };


        const shameResults =
            [];


        /*
         * Process each completed historical season.
         */

        Object.entries(
            brackets
        ).forEach(
            ([year, bracket]) => {

                const season =
                    Number(year);


                const seasonData =
                    historyData.seasons.find(
                        item =>
                            Number(
                                item.season
                            ) === season
                    );


                if (
                    !seasonData ||
                    !Array.isArray(bracket)
                ) {

                    return;

                }


                /*
                 * Roster lookup for this specific season.
                 */

                const rosterMap =
                    {};


                seasonData.teams.forEach(
                    team => {

                        rosterMap[
                            team.roster_id
                        ] = team;

                    }
                );


                /*
                 * p === 5 is the 11th-place matchup.
                 *
                 * The loser finishes 12th.
                 */

/*
 * Find the lowest placement game in the
 * consolation bracket.
 *
 * Sleeper uses:
 *
 * p = 1 -> highest placement game
 * p = 3 -> next placement game
 * p = 5 -> lowest placement game
 *
 * For our 12-team league, the highest p value
 * determines 11th vs 12th place.
 */

const placementGames =
    bracket.filter(
        game =>
            typeof game.p === 'number'
    );


if (
    placementGames.length === 0
) {

    return;

}


const toiletBowl =
    placementGames
        .sort(
            (a, b) =>
                b.p - a.p
        )[0];


                if (
                    !toiletBowl ||
                    !toiletBowl.l
                ) {

                    return;

                }


                const lastPlaceTeam =
                    rosterMap[
                        toiletBowl.l
                    ];


                if (!lastPlaceTeam) {

                    return;

                }


                shameResults.push(
                    {

                        season:
                            season,

                        owner:
                            lastPlaceTeam.owner,

                        team_name:
                            lastPlaceTeam.team_name

                    }
                );

            }
        );


        /*
         * Display oldest to newest.
         */

        shameResults.sort(
            (a, b) =>
                a.season -
                b.season
        );


        if (
            shameResults.length === 0
        ) {

            hallOfShame.innerHTML = `

                <div class="hall-of-shame-empty">
                    No shame has been recorded... somehow.
                </div>

            `;

            return;

        }


        hallOfShame.innerHTML =
            shameResults
                .map(
                    result => `

                        <div class="shame-card">

                            <div class="shame-year">
                                ${result.season}
                            </div>

                            <div class="shame-icon">
                                🚽
                            </div>

                            <div class="shame-label">
                                Toilet Bowl
                            </div>

                            <div class="shame-team">
                                ${result.team_name}
                            </div>

                            <div class="shame-owner">
                                ${result.owner}
                            </div>

                            <div class="shame-footer">
                                12th Place
                            </div>

                        </div>

                    `
                )
                .join('');


    } catch (error) {

        console.error(
            'Hall of Shame error:',
            error
        );


        hallOfShame.innerHTML = `

            <div class="hall-of-shame-empty">
                Unable to load league shame.
            </div>

        `;

    }

}


/*
 * ======================================================
 * INITIAL LOAD
 * ======================================================
 */

loadChampionPennants();

loadHallOfShame();

loadHistorySeason(
    Number(
        historySeasonSelect.value
    )
);
