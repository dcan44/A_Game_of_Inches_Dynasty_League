async function loadManagers() {

    const grid =
        document.getElementById(
            'managers-grid'
        );

const formerManagersContainer =
    document.querySelector(
        '.former-managers-card'
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


                    if (
                        season <= 2025
                    ) {

                        return;

                    }


                    if (
                        seasonData.status !==
                        'complete'
                    ) {

                        return;

                    }


                    const divisions =
                        {};


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


                        if (
                            manager
                                .regular_season
                                .games > 0
                        ) {

                            career.seasons++;

                        }


                        /*
                         * Regular season
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
                         * Playoffs
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
                         * Scoring
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
                         * Highest single-game score
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

const divisionOrder =
    [
        'Kermit Frogs',
        'BMS Mountain G.O.A.T.s',
        'Mount Doom'
    ];


const teams =
    [
        ...teamsData.teams
    ].sort(
        (a, b) => {

            const firstDivision =
                divisionOrder.indexOf(
                    a.division
                );


            const secondDivision =
                divisionOrder.indexOf(
                    b.division
                );


            const firstDivisionOrder =
                firstDivision === -1
                    ? 999
                    : firstDivision;


            const secondDivisionOrder =
                secondDivision === -1
                    ? 999
                    : secondDivision;


            if (
                firstDivisionOrder !==
                secondDivisionOrder
            ) {

                return (
                    firstDivisionOrder -
                    secondDivisionOrder
                );

            }


            const firstOwner =
                getLeagueOwnerName(
                    a.owner_id,
                    a.owner
                );


            const secondOwner =
                getLeagueOwnerName(
                    b.owner_id,
                    b.owner
                );


            return firstOwner.localeCompare(
                secondOwner
            );

        }
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


                /*
                 * =================================================
                 * REAL OWNER NAME
                 * =================================================
                 *
                 * Pull from league-data.js.
                 *
                 * If the owner isn't listed there for some reason,
                 * fall back to their Sleeper username.
                 */

                const ownerName =
                    getLeagueOwnerName(
                        team.owner_id,
                        team.owner
                    );


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
                 * PLAYOFF WINNING PERCENTAGE
                 * =============================================
                 */

                let playoffWinningPercentage =
                    '—';


                if (
                    career
                ) {

                    const playoffGames =
                        career.playoff_wins +
                        career.playoff_losses +
                        career.playoff_ties;


                    if (
                        playoffGames > 0
                    ) {

                        const percentage =
                            (
                                career.playoff_wins +
                                (
                                    career.playoff_ties *
                                    0.5
                                )
                            )
                            /
                            playoffGames;


                        playoffWinningPercentage =
                            (
                                percentage *
                                100
                            ).toFixed(1) +
                            '%';

                    }

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
                 * TROPHY CASE
                 * =============================================
                 */

                let trophyHTML =
                    '';


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

            <h2>
                ${ownerName}
            </h2>

            <p class="manager-team-name">
                ${team.team_name}
            </p>

            <small class="manager-sleeper-username">
                ${team.owner}
            </small>

        </div>


        <button
            type="button"
            class="manager-collapse-button"
            aria-expanded="true"
            aria-label="Collapse ${ownerName}"
        >
            ▲
        </button>

    </div>


    <div class="manager-card-body">

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

    </div>

`;

                grid.appendChild(
                    card
                );

        /*
         * =====================================================
         * FORMER MANAGERS
         * =====================================================
         *
         * Anyone found in historical manager-performance data
         * who is NOT on a current 2026 roster is considered a
         * former manager.
         */


        const currentOwnerIds =
            new Set(
                teams.map(
                    team =>
                        String(
                            team.owner_id
                        )
                )
            );


        const formerManagers =
            Object.values(
                careerMap
            )
                .filter(
                    career =>
                        !currentOwnerIds.has(
                            String(
                                career.owner_id
                            )
                        )
                );


        /*
         * Find the most recent historical franchise/team
         * information for each former manager.
         */

        formerManagers.forEach(
            career => {

                let mostRecentTeam =
                    null;


                let mostRecentSeason =
                    null;


                const seasonsNewestFirst =
                    [
                        ...(
                            historyData.seasons ||
                            []
                        )
                    ]
                        .sort(
                            (a, b) =>
                                Number(
                                    b.season
                                ) -
                                Number(
                                    a.season
                                )
                        );


                for (
                    const seasonData
                    of seasonsNewestFirst
                ) {

                    const historicalTeam =
                        seasonData.teams.find(
                            team =>
                                String(
                                    team.owner_id
                                ) ===
                                String(
                                    career.owner_id
                                )
                        );


                    if (
                        historicalTeam
                    ) {

                        mostRecentTeam =
                            historicalTeam;


                        mostRecentSeason =
                            Number(
                                seasonData.season
                            );


                        break;

                    }

                }


                career.last_team =
                    mostRecentTeam;


                career.last_season =
                    mostRecentSeason;

            }
        );


        /*
         * Sort former managers alphabetically by real name.
         */

        formerManagers.sort(
            (a, b) => {

                const firstName =
                    getLeagueOwnerName(
                        a.owner_id,
                        a.owner
                    );


                const secondName =
                    getLeagueOwnerName(
                        b.owner_id,
                        b.owner
                    );


                return firstName.localeCompare(
                    secondName
                );

            }
        );


        /*
         * =====================================================
         * DISPLAY FORMER MANAGERS
         * =====================================================
         */

        if (
            formerManagers.length === 0
        ) {

            formerManagersContainer.innerHTML = `

                <div class="former-managers-empty">

                    No former managers yet.

                </div>

            `;

        }

        else {

            formerManagersContainer.innerHTML = `

                <div
                    id="former-managers-grid"
                    class="former-managers-grid"
                ></div>

            `;


            const formerGrid =
                document.getElementById(
                    'former-managers-grid'
                );


            formerManagers.forEach(
                career => {

                    const ownerName =
                        getLeagueOwnerName(
                            career.owner_id,
                            career.owner
                        );


                    /*
                     * =========================================
                     * CAREER RECORD
                     * =========================================
                     */

                    let regularRecord =
                        `${career.regular_wins}-${career.regular_losses}`;


                    if (
                        career.regular_ties > 0
                    ) {

                        regularRecord +=
                            `-${career.regular_ties}`;

                    }


                    /*
                     * =========================================
                     * PLAYOFF RECORD
                     * =========================================
                     */

                    let playoffRecord =
                        `${career.playoff_wins}-${career.playoff_losses}`;


                    if (
                        career.playoff_ties > 0
                    ) {

                        playoffRecord +=
                            `-${career.playoff_ties}`;

                    }


                    /*
                     * =========================================
                     * WIN PERCENTAGE
                     * =========================================
                     */

                    let winningPercentage =
                        '—';


                    if (
                        career.regular_games > 0
                    ) {

                        winningPercentage =
                            (
                                (
                                    (
                                        career.regular_wins +
                                        (
                                            career.regular_ties *
                                            0.5
                                        )
                                    )
                                    /
                                    career.regular_games
                                )
                                *
                                100
                            ).toFixed(1) +
                            '%';

                    }


                    /*
                     * =========================================
                     * CAREER PPG
                     * =========================================
                     */

                    let careerPPG =
                        '—';


                    if (
                        career.regular_games > 0
                    ) {

                        careerPPG =
                            (
                                career.points_for /
                                career.regular_games
                            ).toFixed(2);

                    }


                    /*
                     * =========================================
                     * HIGHEST SCORE
                     * =========================================
                     */

                    let highestTeamScore =
                        '—';


                    if (
                        career.highest_team_score
                    ) {

                        highestTeamScore = `

                            ${career.highest_team_score.points.toFixed(2)}

                            <small>
                                Week ${career.highest_team_score.week},
                                ${career.highest_team_score.season}
                            </small>

                        `;

                    }


                    /*
                     * =========================================
                     * HISTORICAL HONORS
                     * =========================================
                     */

                    const championshipYears =
                        getYearsForOwner(
                            podiumFinishes.champions,
                            career.owner_id
                        );


                    const runnerUpYears =
                        getYearsForOwner(
                            podiumFinishes.runnersUp,
                            career.owner_id
                        );


                    const thirdPlaceYears =
                        getYearsForOwner(
                            podiumFinishes.thirdPlace,
                            career.owner_id
                        );


                    const managerDivisionTitles =
                        (
                            divisionTitles[
                                career.owner_id
                            ] ||
                            []
                        )
                            .sort(
                                (a, b) =>
                                    a - b
                            );


                    /*
                     * =========================================
                     * TROPHY CASE
                     * =========================================
                     */

                    let trophyHTML =
                        '';


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


                    if (
                        !trophyHTML
                    ) {

                        trophyHTML = `

                            <div class="empty-trophy-case">
                                No league honors
                            </div>

                        `;

                    }


                    /*
                     * =========================================
                     * LAST FRANCHISE
                     * =========================================
                     */

                    const lastTeamName =
                        career.last_team
                            ?.team_name ||
                        'Former Franchise';


/*
 * =========================================
 * CARD
 * =========================================
 */

const card =
    document.createElement(
        'article'
    );


card.className =
    'manager-card former-manager-card';


card.innerHTML = `

    <div class="manager-card-top">

        <div
            class="
                manager-avatar
                manager-avatar-placeholder
                former-manager-avatar
            "
        >
            ${ownerName.charAt(0)}
        </div>


        <div class="manager-identity">

            <h2>
                ${ownerName}
            </h2>

            <p class="manager-team-name">
                ${lastTeamName}
            </p>

            <small class="manager-sleeper-username">
                ${career.owner}
            </small>

        </div>


        <button
            type="button"
            class="manager-collapse-button"
            aria-expanded="false"
            aria-label="Expand ${ownerName}"
        >
            ▼
        </button>

    </div>


    <div class="manager-card-body mobile-collapsed">

        <div class="former-manager-tenure">

            Last Active:
            ${
                career.last_season ||
                '—'
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
                    Seasons
                </span>

                <strong>
                    ${career.seasons}
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

    </div>

`;


formerGrid.appendChild(
    card
);

                }
            );

        }

                
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



/*
 * ======================================================
 * GET REAL OWNER NAME
 * ======================================================
 *
 * Uses league-data.js.
 *
 * If league-data.js is missing or the manager has not
 * been entered, the Sleeper username is used instead.
 */

function getLeagueOwnerName(
    ownerId,
    fallback
) {

    if (
        typeof LEAGUE_DATA !==
            'undefined' &&
        typeof LEAGUE_DATA.getOwnerName ===
            'function'
    ) {

        return LEAGUE_DATA.getOwnerName(
            ownerId,
            fallback
        );

    }


    return fallback ||
        'Unknown Manager';

}

/*
 * ======================================================
 * MOBILE MANAGER CARD COLLAPSE
 * ======================================================
 */

document.addEventListener(
    'click',
    event => {

        const button =
            event.target.closest(
                '.manager-collapse-button'
            );


        if (
            !button
        ) {

            return;

        }


        const card =
            button.closest(
                '.manager-card'
            );


        if (
            !card
        ) {

            return;

        }


        const body =
            card.querySelector(
                '.manager-card-body'
            );


        if (
            !body
        ) {

            return;

        }


        const isCollapsed =
            body.classList.toggle(
                'mobile-collapsed'
            );


        button.textContent =
            isCollapsed
                ? '▼'
                : '▲';


        button.setAttribute(
            'aria-expanded',
            String(
                !isCollapsed
            )
        );


        const managerName =
            card.querySelector(
                '.manager-identity h2'
            )?.textContent.trim() ||
            'manager';


        button.setAttribute(
            'aria-label',
            isCollapsed
                ? `Expand ${managerName}`
                : `Collapse ${managerName}`
        );

    }
);

loadManagers();
