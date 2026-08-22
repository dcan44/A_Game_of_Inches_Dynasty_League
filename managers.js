async function loadManagers() {

    const grid =
        document.getElementById(
            'managers-grid'
        );


    try {

        /*
         * =====================================================
         * LOAD CURRENT + HISTORICAL DATA
         * =====================================================
         */

        const [
            teamsResponse,
            historyResponse,

            performance2023Response,
            performance2024Response,
            performance2025Response,
            performance2026Response,

            bracket2023Response,
            bracket2024Response,
            bracket2025Response,
            bracket2026Response

        ] = await Promise.all([

            fetch('/api/teams'),

            fetch('/api/history'),

            fetch(
                '/api/manager-performance?season=2023'
            ),

            fetch(
                '/api/manager-performance?season=2024'
            ),

            fetch(
                '/api/manager-performance?season=2025'
            ),

            fetch(
                '/api/manager-performance?season=2026'
            ),


            fetch(
                'https://api.sleeper.app/v1/league/978545340355862528/winners_bracket'
            ),

            fetch(
                'https://api.sleeper.app/v1/league/1050836306860957696/winners_bracket'
            ),

            fetch(
                'https://api.sleeper.app/v1/league/1181097603123351552/winners_bracket'
            ),

            fetch(
                'https://api.sleeper.app/v1/league/1312098239821914112/winners_bracket'
            )

        ]);


        /*
         * Core responses must work.
         *
         * An unavailable playoff bracket should NOT
         * prevent the entire Managers page from loading.
         */

        const requiredResponses = [

            teamsResponse,
            historyResponse,

            performance2023Response,
            performance2024Response,
            performance2025Response,
            performance2026Response

        ];


        if (
            requiredResponses.some(
                response =>
                    !response.ok
            )
        ) {

            throw new Error(
                'Unable to retrieve manager data.'
            );

        }


        /*
         * =====================================================
         * PARSE DATA
         * =====================================================
         */

        const teamsData =
            await teamsResponse.json();


        const historyData =
            await historyResponse.json();


        const performanceData = [

            await performance2023Response.json(),

            await performance2024Response.json(),

            await performance2025Response.json(),

            await performance2026Response.json()

        ];


        const bracketData = {

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
                    : [],

            2026:
                bracket2026Response.ok
                    ? await bracket2026Response.json()
                    : []

        };


        if (
            !teamsData.teams
        ) {

            throw new Error(
                'No current teams returned.'
            );

        }


        /*
         * =====================================================
         * PLAYOFF PODIUM FINISHES
         * =====================================================
         *
         * Sleeper winners_bracket:
         *
         * p = 1  -> Championship game
         *           winner = Champion
         *           loser  = Runner-Up
         *
         * p = 3  -> Third-place game
         *           winner = Third Place
         *
         * We convert roster IDs into owner IDs using
         * that season's historical roster information.
         */

        const podiumFinishes = {

            champions:
                {},

            runnersUp:
                {},

            thirdPlace:
                {}

        };


        if (
            historyData.seasons
        ) {

            historyData.seasons.forEach(
                seasonData => {

                    const season =
                        Number(
                            seasonData.season
                        );


                    const bracket =
                        bracketData[
                            season
                        ] || [];


                    if (
                        bracket.length === 0
                    ) {

                        return;

                    }


                    /*
                     * Roster -> Owner lookup
                     * for this specific season.
                     */

                    const rosterOwnerMap =
                        {};


                    seasonData.teams.forEach(
                        team => {

                            rosterOwnerMap[
                                team.roster_id
                            ] =
                                team.owner_id;

                        }
                    );


                    /*
                     * Championship game
                     */

                    const championshipGame =
                        bracket.find(
                            game =>
                                game.p === 1
                        );


                    if (
                        championshipGame
                    ) {

                        const championOwner =
                            rosterOwnerMap[
                                championshipGame.w
                            ];


                        const runnerUpOwner =
                            rosterOwnerMap[
                                championshipGame.l
                            ];


                        if (
                            championOwner
                        ) {

                            podiumFinishes
                                .champions[
                                    season
                                ] =
                                    championOwner;

                        }


                        if (
                            runnerUpOwner
                        ) {

                            podiumFinishes
                                .runnersUp[
                                    season
                                ] =
                                    runnerUpOwner;

                        }

                    }


                    /*
                     * Third-place game
                     */

                    const thirdPlaceGame =
                        bracket.find(
                            game =>
                                game.p === 3
                        );


                    if (
                        thirdPlaceGame
                    ) {

                        const thirdPlaceOwner =
                            rosterOwnerMap[
                                thirdPlaceGame.w
                            ];


                        if (
                            thirdPlaceOwner
                        ) {

                            podiumFinishes
                                .thirdPlace[
                                    season
                                ] =
                                    thirdPlaceOwner;

                        }

                    }

                }
            );

        }


        /*
         * =====================================================
         * CONFIRMED CHAMPIONSHIP FALLBACKS
         * =====================================================
         *
         * These preserve the known historical champions
         * even if Sleeper ever fails to return an old bracket.
         */

        const confirmedChampions = {

            2023:
                "978544154789699584",

            2024:
                "978815135223525376",

            2025:
                "1060373241799262208"

        };


        Object.entries(
            confirmedChampions
        ).forEach(
            ([year, ownerId]) => {

                if (
                    !podiumFinishes
                        .champions[
                            year
                        ]
                ) {

                    podiumFinishes
                        .champions[
                            year
                        ] =
                            ownerId;

                }

            }
        );


        /*
         * =====================================================
         * DIVISION CHAMPIONS
         * =====================================================
         *
         * 2023-2025 are stored manually because the
         * division configuration changed historically.
         *
         * Beginning in 2026, division winners can be
         * calculated automatically from Sleeper.
         */

        const divisionTitles =
            {};


        const historicalDivisionChampions = {

            2023: [

                "978544154789699584",
                "984495671757611008"

            ],

            2024: [

                "978544154789699584",
                "978815135223525376"

            ],

            2025: [

                "978544154789699584",
                "1060373241799262208"

            ]

        };


        /*
         * Add confirmed historical division titles.
         */

        Object.entries(
            historicalDivisionChampions
        ).forEach(
            ([year, ownerIds]) => {

                ownerIds.forEach(
                    ownerId => {

                        if (
                            !divisionTitles[
                                ownerId
                            ]
                        ) {

                            divisionTitles[
                                ownerId
                            ] = [];

                        }


                        divisionTitles[
                            ownerId
                        ].push(
                            Number(
                                year
                            )
                        );

                    }
                );

            }
        );


        /*
         * =====================================================
         * AUTOMATIC DIVISION CHAMPIONS
         * 2026 AND FUTURE
         * =====================================================
         */

        if (
            historyData.seasons
        ) {

            historyData.seasons.forEach(
                seasonData => {

                    const season =
                        Number(
                            seasonData.season
                        );


                    /*
                     * Historical years are manually preserved.
                     */

                    if (
                        season <= 2025
                    ) {

                        return;

                    }


                    /*
                     * Do not award division championships
                     * until the season is complete.
                     */

                    if (
                        seasonData.status !==
                        'complete'
                    ) {

                        return;

                    }


                    const divisions =
                        {};


                    /*
                     * Group teams by division.
                     */

                    seasonData.teams.forEach(
                        team => {

                            if (
                                !team.division
                            ) {

                                return;

                            }


                            if (
                                !divisions[
                                    team.division
                                ]
                            ) {

                                divisions[
                                    team.division
                                ] = [];

                            }


                            divisions[
                                team.division
                            ].push(
                                team
                            );

                        }
                    );


                    /*
                     * Determine each division winner.
                     *
                     * Tiebreak:
                     *
                     * 1. Wins
                     * 2. Fewer losses
                     * 3. Points For
                     */

                    Object.values(
                        divisions
                    ).forEach(
                        divisionTeams => {

                            divisionTeams.sort(
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


                            const winner =
                                divisionTeams[
                                    0
                                ];


                            if (
                                !winner ||
                                !winner.owner_id
                            ) {

                                return;

                            }


                            if (
                                !divisionTitles[
                                    winner.owner_id
                                ]
                            ) {

                                divisionTitles[
                                    winner.owner_id
                                ] = [];

                            }


                            divisionTitles[
                                winner.owner_id
                            ].push(
                                season
                            );

                        }
                    );

                }
            );

        }


        /*
         * =====================================================
         * BUILD CAREER STATISTICS
         * =====================================================
         */

        const careerMap =
            {};


        performanceData.forEach(
            seasonData => {

                if (
                    !seasonData.managers
                ) {

                    return;

                }


                seasonData.managers.forEach(
                    manager => {

                        if (
                            !careerMap[
                                manager.owner_id
                            ]
                        ) {

                            careerMap[
                                manager.owner_id
                            ] = {

                                owner_id:
                                    manager.owner_id,

                                owner:
                                    manager.owner,

                                seasons:
                                    0,

                                regular_wins:
                                    0,

                                regular_losses:
                                    0,

                                regular_ties:
                                    0,

                                playoff_wins:
                                    0,

                                playoff_losses:
                                    0,

                                playoff_ties:
                                    0,

                                points_for:
                                    0,

                                points_against:
                                    0,

                                regular_games:
                                    0,

                                highest_team_score:
                                    null

                            };

                        }


                        const career =
                            careerMap[
                                manager.owner_id
                            ];


                        /*
                         * Count a season once regular-season
                         * games have actually been played.
                         */

                        if (
                            manager
                                .regular_season
                                .games > 0
                        ) {

                            career.seasons++;

                        }


                        /*
                         * Regular season.
                         */

                        career.regular_wins +=
                            manager
                                .regular_season
                                .wins;


                        career.regular_losses +=
                            manager
                                .regular_season
                                .losses;


                        career.regular_ties +=
                            manager
                                .regular_season
                                .ties;


                        career.regular_games +=
                            manager
                                .regular_season
                                .games;


                        /*
                         * Championship playoffs.
                         */

                        career.playoff_wins +=
                            manager
                                .playoffs
                                .wins;


                        career.playoff_losses +=
                            manager
                                .playoffs
                                .losses;


                        career.playoff_ties +=
                            manager
                                .playoffs
                                .ties;


                        /*
                         * Scoring.
                         */

                        career.points_for +=
                            manager
                                .scoring
                                .points_for;


                        career.points_against +=
                            manager
                                .scoring
                                .points_against;


                        /*
                         * Highest single-game score.
                         */

                        if (
                            manager.highest_team_score &&
                            (
                                !career.highest_team_score ||
                                manager
                                    .highest_team_score
                                    .points >
                                career
                                    .highest_team_score
                                    .points
                            )
                        ) {

                            career.highest_team_score =
                                {

                                    ...manager
                                        .highest_team_score

                                };

                        }

                    }
                );

            }
        );


        /*
         * =====================================================
         * CURRENT TEAMS
         * =====================================================
         */

        const teams =
            [
                ...teamsData.teams
            ].sort(
                (a, b) =>
                    a.roster_id -
                    b.roster_id
            );


        grid.innerHTML =
            '';


        /*
         * =====================================================
         * BUILD EACH MANAGER CARD
         * =====================================================
         */

        teams.forEach(
            team => {

                const career =
                    careerMap[
                        team.owner_id
                    ];


                const card =
                    document.createElement(
                        'article'
                    );


                card.className =
                    'manager-card';


                /*
                 * =============================================
                 * AVATAR
                 * =============================================
                 */

                const avatar =
                    team.avatar
                        ? `
                            <img
                                class="manager-avatar"
                                src="${team.avatar}"
                                alt="${team.team_name}"
                            >
                          `
                        : `
                            <div
                                class="
                                    manager-avatar
                                    manager-avatar-placeholder
                                "
                            >
                                ${team.team_name.charAt(0)}
                            </div>
                          `;


                /*
                 * =============================================
                 * CURRENT RECORD
                 * =============================================
                 */

                const currentRecord =
                    `${team.wins}-${team.losses}` +
                    (
                        team.ties
                            ? `-${team.ties}`
                            : ''
                    );


                /*
                 * =============================================
                 * CAREER REGULAR-SEASON RECORD
                 * =============================================
                 */

                let regularRecord =
                    '—';


                if (
                    career
                ) {

                    regularRecord =
                        `${career.regular_wins}-${career.regular_losses}`;


                    if (
                        career.regular_ties > 0
                    ) {

                        regularRecord +=
                            `-${career.regular_ties}`;

                    }

                }


                /*
                 * =============================================
                 * PLAYOFF RECORD
                 * =============================================
                 */

                let playoffRecord =
                    '0-0';


                if (
                    career
                ) {

                    playoffRecord =
                        `${career.playoff_wins}-${career.playoff_losses}`;


                    if (
                        career.playoff_ties > 0
                    ) {

                        playoffRecord +=
                            `-${career.playoff_ties}`;

                    }

                }


                /*
                 * =============================================
                 * WINNING PERCENTAGE
                 * =============================================
                 */

                let winningPercentage =
                    '—';


                if (
                    career &&
                    career.regular_games > 0
                ) {

                    const percentage =
                        (
                            career.regular_wins +
                            (
                                career.regular_ties *
                                0.5
                            )
                        )
                        /
                        career.regular_games;


                    winningPercentage =
                        (
                            percentage *
                            100
                        ).toFixed(1) +
                        '%';

                }


                /*
                 * =============================================
                 * CAREER PPG
                 * =============================================
                 */

                let careerPPG =
                    '—';


                if (
                    career &&
                    career.regular_games > 0
                ) {

                    careerPPG =
                        (
                            career.points_for /
                            career.regular_games
                        ).toFixed(2);

                }


                /*
                 * =============================================
                 * HIGHEST TEAM SCORE
                 * =============================================
                 */

                let highestTeamScore =
                    '—';


                if (
                    career &&
                    career.highest_team_score
                ) {

                    highestTeamScore =
                        `
                            ${career.highest_team_score.points.toFixed(2)}

                            <small>
                                Week ${career.highest_team_score.week},
                                ${career.highest_team_score.season}
                            </small>
                        `;

                }


                /*
                 * =============================================
                 * PODIUM FINISHES
                 * =============================================
                 */

                const championshipYears =
                    getYearsForOwner(
                        podiumFinishes.champions,
                        team.owner_id
                    );


                const runnerUpYears =
                    getYearsForOwner(
                        podiumFinishes.runnersUp,
                        team.owner_id
                    );


                const thirdPlaceYears =
                    getYearsForOwner(
                        podiumFinishes.thirdPlace,
                        team.owner_id
                    );


                const managerDivisionTitles =
                    (
                        divisionTitles[
                            team.owner_id
                        ] || []
                    )
                        .sort(
                            (a, b) =>
                                a - b
                        );


                /*
                 * =============================================
                 * TROPHY CASE HTML
                 * =============================================
                 */

                let trophyHTML =
                    '';


                /*
                 * LEAGUE CHAMPION
                 */

                championshipYears.forEach(
                    year => {

                        trophyHTML += `

                            <div
                                class="
                                    trophy-badge
                                    championship-badge
                                "
                                title="${year} League Champion"
                            >

                                <span class="trophy-icon">
                                    🏆
                                </span>

                                <span class="trophy-text">
                                    ${year}
                                </span>

                            </div>

                        `;

                    }
                );


                /*
                 * RUNNER-UP
                 */

                runnerUpYears.forEach(
                    year => {

                        trophyHTML += `

                            <div
                                class="
                                    trophy-badge
                                    runnerup-badge
                                "
                                title="${year} League Runner-Up"
                            >

                                <span class="trophy-icon">
                                    🏆
                                </span>

                                <span class="trophy-text">
                                    2ND ${year}
                                </span>

                            </div>

                        `;

                    }
                );


                /*
                 * THIRD PLACE
                 */

                thirdPlaceYears.forEach(
                    year => {

                        trophyHTML += `

                            <div
                                class="
                                    trophy-badge
                                    third-place-badge
                                "
                                title="${year} Third Place"
                            >

                                <span class="trophy-icon">
                                    🏆
                                </span>

                                <span class="trophy-text">
                                    3RD ${year}
                                </span>

                            </div>

                        `;

                    }
                );


                /*
                 * DIVISION CHAMPION
                 */

                managerDivisionTitles.forEach(
                    year => {

                        trophyHTML += `

                            <div
                                class="
                                    trophy-badge
                                    division-badge
                                "
                                title="${year} Division Champion"
                            >

                                <span class="division-star">
                                    ★
                                </span>

                                <span class="trophy-text">
                                    DIV ${year}
                                </span>

                            </div>

                        `;

                    }
                );


                /*
                 * Empty case.
                 */

                if (
                    !trophyHTML
                ) {

                    trophyHTML = `

                        <div class="empty-trophy-case">
                            No league honors yet
                        </div>

                    `;

                }


                /*
                 * =============================================
                 * CARD HTML
                 * =============================================
                 */

                card.innerHTML = `

                    <div class="manager-card-top">

                        ${avatar}

                        <div class="manager-identity">

                            <span class="manager-number">

                                FRANCHISE ${String(
                                    team.roster_id
                                ).padStart(
                                    2,
                                    '0'
                                )}

                            </span>

                            <h2>
                                ${team.team_name}
                            </h2>

                            <p>
                                ${team.owner}
                            </p>

                        </div>

                    </div>


                    <div class="manager-division">

                        ${
                            team.division ||
                            'Division'
                        }

                    </div>


                    <div class="trophy-case">

                        <div class="trophy-case-title">
                            Trophy Case
                        </div>

                        <div class="trophy-case-grid">

                            ${trophyHTML}

                        </div>

                    </div>


                    <div class="manager-stats">


                        <div class="manager-stat">

                            <span>
                                2026 Record
                            </span>

                            <strong>
                                ${currentRecord}
                            </strong>

                        </div>


                        <div class="manager-stat">

                            <span>
                                Seasons
                            </span>

                            <strong>

                                ${
                                    career
                                        ? career.seasons
                                        : '—'
                                }

                            </strong>

                        </div>


                        <div class="manager-stat">

                            <span>
                                Regular Season
                            </span>

                            <strong>
                                ${regularRecord}
                            </strong>

                        </div>


                        <div class="manager-stat">

                            <span>
                                Win %
                            </span>

                            <strong>
                                ${winningPercentage}
                            </strong>

                        </div>


                        <div class="manager-stat">

                            <span>
                                Playoffs
                            </span>

                            <strong>
                                ${playoffRecord}
                            </strong>

                        </div>


                        <div class="manager-stat">

                            <span>
                                Career PPG
                            </span>

                            <strong>
                                ${careerPPG}
                            </strong>

                        </div>


                        <div class="manager-stat">

                            <span>
                                Championships
                            </span>

                            <strong>
                                ${championshipYears.length}
                            </strong>

                        </div>


                        <div class="manager-stat">

                            <span>
                                Division Titles
                            </span>

                            <strong>
                                ${managerDivisionTitles.length}
                            </strong>

                        </div>


                    </div>


                    <div class="manager-records">


                        <div>

                            <span>
                                Highest Team Score
                            </span>

                            <strong>
                                ${highestTeamScore}
                            </strong>

                        </div>


                    </div>

                `;


                grid.appendChild(
                    card
                );

            }
        );


    } catch (
        error
    ) {

        console.error(
            'Error loading managers:',
            error
        );


        grid.innerHTML = `

            <div
                class="
                    manager-loading
                    manager-error
                "
            >

                Unable to load manager information.

            </div>

        `;

    }

}



/*
 * ======================================================
 * GET YEARS FOR AN OWNER
 * ======================================================
 */

function getYearsForOwner(
    placementMap,
    ownerId
) {

    return Object.entries(
        placementMap
    )
        .filter(
            ([year, placementOwnerId]) =>
                placementOwnerId ===
                ownerId
        )
        .map(
            ([year]) =>
                Number(
                    year
                )
        )
        .sort(
            (a, b) =>
                a - b
        );

}



loadManagers();
