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
 * In our consolation bracket:
 *
 * - Winning moves a team toward a better finish.
 * - Losing moves a team deeper into the bracket.
 * - The worst two regular-season teams receive byes.
 *
 * Therefore the p === 1 game is the final
 * Toilet Bowl matchup.
 *
 * The LOSER of that game finishes 12th.
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


        const shameResults = [];


        /*
         * Process each historical season separately
         * so roster ownership stays season-specific.
         */

        for (
            const [yearText, leagueId]
            of Object.entries(leagueIds)
        ) {

            const season =
                Number(yearText);


            const [
                bracketResponse,
                rostersResponse,
                usersResponse
            ] = await Promise.all([

                fetch(
                    `https://api.sleeper.app/v1/league/${leagueId}/losers_bracket`
                ),

                fetch(
                    `https://api.sleeper.app/v1/league/${leagueId}/rosters`
                ),

                fetch(
                    `https://api.sleeper.app/v1/league/${leagueId}/users`
                )

            ]);


            if (
                !bracketResponse.ok ||
                !rostersResponse.ok ||
                !usersResponse.ok
            ) {

                continue;

            }


            const bracket =
                await bracketResponse.json();


            const rosters =
                await rostersResponse.json();


            const users =
                await usersResponse.json();


            /*
             * =============================================
             * USER LOOKUP
             * =============================================
             */

            const userMap = {};


            users.forEach(
                user => {

                    userMap[
                        user.user_id
                    ] = user;

                }
            );


            /*
             * =============================================
             * ROSTER LOOKUP
             * =============================================
             */

            const rosterMap = {};


            rosters.forEach(
                roster => {

                    const user =
                        userMap[
                            roster.owner_id
                        ];


                    rosterMap[
                        roster.roster_id
                    ] = {

                        roster_id:
                            roster.roster_id,

                        owner_id:
                            roster.owner_id,

                        owner:
                            user?.display_name ||
                            "Unknown Manager",

                        team_name:
                            user
                                ?.metadata
                                ?.team_name
                                ?.trim() ||
                            user?.display_name ||
                            `Team ${roster.roster_id}`

                    };

                }
            );


            /*
             * =============================================
             * TOILET BOWL FINAL
             * =============================================
             *
             * Unlike the championship bracket, the
             * consolation bracket advances teams toward
             * last place through losses.
             *
             * The p === 1 matchup is therefore the final
             * Toilet Bowl game.
             */

            const toiletBowlFinal =
                bracket.find(
                    game =>
                        game.p === 1
                );


            if (
                !toiletBowlFinal ||
                !toiletBowlFinal.l
            ) {

                continue;

            }


            /*
             * The loser of the Toilet Bowl final
             * finishes 12th.
             */

            const lastPlaceRosterId =
                toiletBowlFinal.l;


            const lastPlaceTeam =
                rosterMap[
                    lastPlaceRosterId
                ];


            if (
                !lastPlaceTeam
            ) {

                continue;

            }


            shameResults.push(
                {

                    season:
                        season,

                    roster_id:
                        lastPlaceRosterId,

                    owner_id:
                        lastPlaceTeam.owner_id,

                    owner:
                        lastPlaceTeam.owner,

                    team_name:
                        lastPlaceTeam.team_name

                }
            );

        }


        /*
         * Oldest season first.
         */

        shameResults.sort(
            (a, b) =>
                a.season -
                b.season
        );


        /*
         * =============================================
         * DISPLAY
         * =============================================
         */

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
