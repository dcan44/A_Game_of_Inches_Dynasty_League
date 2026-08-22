async function loadManagers() {

    const grid =
        document.getElementById('managers-grid');

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
            performance2026Response
        ] = await Promise.all([

            fetch('/api/teams'),

            fetch('/api/history'),

            fetch('/api/manager-performance?season=2023'),

            fetch('/api/manager-performance?season=2024'),

            fetch('/api/manager-performance?season=2025'),

            fetch('/api/manager-performance?season=2026')

        ]);


        const responses = [

            teamsResponse,
            historyResponse,
            performance2023Response,
            performance2024Response,
            performance2025Response,
            performance2026Response

        ];


        if (
            responses.some(
                response => !response.ok
            )
        ) {

            throw new Error(
                'Unable to retrieve manager data.'
            );

        }


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


        if (!teamsData.teams) {

            throw new Error(
                'No current teams returned.'
            );

        }


        /*
         * =====================================================
         * CONFIRMED LEAGUE CHAMPIONS
         * =====================================================
         *
         * These are intentionally stored separately from
         * Sleeper team names because team names change.
         */

        const champions = {

            2023:
                "978544154789699584", // Dan

            2024:
                "978815135223525376", // RJ

            2025:
                "1060373241799262208" // Seth

        };


        /*
 * =====================================================
 * DIVISION CHAMPIONS
 * =====================================================
 *
 * Historical division champions are stored manually
 * because the league's division structure changed
 * between seasons.
 *
 * Starting in 2026, division champions are calculated
 * automatically from Sleeper.
 */

const divisionTitles = {};


/*
 * =====================================================
 * CONFIRMED HISTORICAL DIVISION CHAMPIONS
 * =====================================================
 */

const historicalDivisionChampions = {

    2023: [
        "978544154789699584",  // dcan44
        "984495671757611008"   // Brandonwastaken
    ],

    2024: [
        "978544154789699584",  // dcan44
        "978815135223525376"   // RJ196
    ],

    2025: [
        "978544154789699584",  // dcan44
        "1060373241799262208"  // ChefBoySJ
    ]

};


/*
 * Add confirmed historical titles.
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
                    Number(year)
                );

            }
        );

    }
);


/*
 * =====================================================
 * AUTOMATIC DIVISION CHAMPIONS — 2026 AND FUTURE
 * =====================================================
 */

if (historyData.seasons) {

    historyData.seasons.forEach(
        seasonData => {

            const season =
                Number(
                    seasonData.season
                );


            /*
             * Historical seasons are handled manually.
             */

            if (season <= 2025) {

                return;

            }


            /*
             * Do not award a division title for an
             * unfinished season.
             */

            if (
                seasonData.status !==
                'complete'
            ) {

                return;

            }


            const divisions = {};


            /*
             * Group teams by division.
             */

            seasonData.teams.forEach(
                team => {

                    if (!team.division) {

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
                    ].push(team);

                }
            );


            /*
             * Determine the winner of each division.
             *
             * Tiebreak order:
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
                        divisionTeams[0];


                    if (
                        winner &&
                        winner.owner_id
                    ) {

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

        const careerMap = {};


        performanceData.forEach(
            seasonData => {

                if (!seasonData.managers) {
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
                         * Count a season once games
                         * have actually been played.
                         */

                        if (
                            manager.regular_season.games > 0
                        ) {

                            career.seasons++;

                        }


                        /*
                         * Regular-season record
                         */

                        career.regular_wins +=
                            manager.regular_season.wins;

                        career.regular_losses +=
                            manager.regular_season.losses;

                        career.regular_ties +=
                            manager.regular_season.ties;

                        career.regular_games +=
                            manager.regular_season.games;


                        /*
                         * Championship playoff record
                         */

                        career.playoff_wins +=
                            manager.playoffs.wins;

                        career.playoff_losses +=
                            manager.playoffs.losses;

                        career.playoff_ties +=
                            manager.playoffs.ties;


                        /*
                         * Scoring
                         */

                        career.points_for +=
                            manager.scoring.points_for;

                        career.points_against +=
                            manager.scoring.points_against;


                        /*
                         * Highest single-game team score
                         */

                        if (
                            manager.highest_team_score &&
                            (
                                !career.highest_team_score ||
                                manager.highest_team_score.points >
                                career.highest_team_score.points
                            )
                        ) {

                            career.highest_team_score = {

                                ...manager.highest_team_score

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
            [...teamsData.teams].sort(
                (a, b) =>
                    a.roster_id -
                    b.roster_id
            );


        grid.innerHTML = '';


        /*
         * =====================================================
         * BUILD EACH MANAGER CARD
         * =====================================================
         */

        teams.forEach(team => {

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
             * Avatar
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
             * Current-season record
             */

            const currentRecord =
                `${team.wins}-${team.losses}` +
                (
                    team.ties
                        ? `-${team.ties}`
                        : ''
                );


            /*
             * Career regular-season record
             */

            let regularRecord = '—';


            if (career) {

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
             * Career playoff record
             */

            let playoffRecord =
                '0-0';


            if (career) {

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
             * Career winning percentage
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
                    ).toFixed(1) + '%';

            }


            /*
             * Career points per game
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
             * Highest team score
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
             * =================================================
             * TROPHY CASE
             * =================================================
             */

            const championshipYears =
                Object.entries(champions)
                    .filter(
                        ([year, ownerId]) =>
                            ownerId ===
                            team.owner_id
                    )
                    .map(
                        ([year]) =>
                            Number(year)
                    )
                    .sort(
                        (a, b) =>
                            a - b
                    );


            const managerDivisionTitles =
                divisionTitles[
                    team.owner_id
                ] || [];


          let trophyHTML = '';


/*
 * Championship banners
 */

championshipYears.forEach(year => {

    trophyHTML += `

        <div class="trophy-badge championship-badge">

            <span class="trophy-icon">
                🏆
            </span>

            <span class="trophy-text">
                ${year}
            </span>

        </div>

    `;

});


/*
 * Division championship banners
 */

managerDivisionTitles.forEach(year => {

    trophyHTML += `

        <div class="trophy-badge division-badge">

            <span class="trophy-text">
                DIV ${year}
            </span>

        </div>

    `;

});


/*
 * Empty trophy case
 */

if (!trophyHTML) {

    trophyHTML = `

        <div class="empty-trophy-case">
            No league honors yet
        </div>

    `;

}


            /*
             * =================================================
             * CARD HTML
             * =================================================
             */

            card.innerHTML = `

                <div class="manager-card-top">

                    ${avatar}

                    <div class="manager-identity">

                        <span class="manager-number">
                            FRANCHISE ${String(
                                team.roster_id
                            ).padStart(2, '0')}
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

                    ${team.division || 'Division'}

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
                            Highest Player Score
                        </span>

                        <strong>
                            Coming Soon
                        </strong>

                    </div>


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

        });


    } catch (error) {

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


loadManagers();
