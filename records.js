async function loadRecords() {

    const tableBody =
        document.getElementById(
            'manager-records-body'
        );


    const recordsGrid =
        document.getElementById(
            'league-records-grid'
        );


    try {

        /*
         * =====================================================
         * LOAD DATA
         * =====================================================
         */

       const [
    teamsResponse,
    historyResponse,

    performance2023Response,
    performance2024Response,
    performance2025Response,
    performance2026Response,

    matchups2023Response,
    matchups2024Response,
    matchups2025Response,
    matchups2026Response

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
        '/api/matchup-history?season=2023'
    ),

    fetch(
        '/api/matchup-history?season=2024'
    ),

    fetch(
        '/api/matchup-history?season=2025'
    ),

    fetch(
        '/api/matchup-history?season=2026'
    )

]);


const responses = [

    teamsResponse,
    historyResponse,

    performance2023Response,
    performance2024Response,
    performance2025Response,
    performance2026Response,

    matchups2023Response,
    matchups2024Response,
    matchups2025Response,
    matchups2026Response

];


        if (
            responses.some(
                response => !response.ok
            )
        ) {

            throw new Error(
                'Unable to retrieve record data.'
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

const matchupData = [

    {
        season: 2023,
        data:
            await matchups2023Response.json()
    },

    {
        season: 2024,
        data:
            await matchups2024Response.json()
    },

    {
        season: 2025,
        data:
            await matchups2025Response.json()
    },

    {
        season: 2026,
        data:
            await matchups2026Response.json()
    }

];

        
        /*
         * =====================================================
         * CURRENT MANAGERS
         * =====================================================
         */

        const currentOwnerIds =
            new Set(
                (teamsData.teams || [])
                    .map(
                        team => team.owner_id
                    )
            );


        /*
         * =====================================================
         * CONFIRMED CHAMPIONS
         * =====================================================
         */

        const champions = {

            2023:
                "978544154789699584",

            2024:
                "978815135223525376",

            2025:
                "1060373241799262208"

        };


        /*
         * =====================================================
         * CONFIRMED HISTORICAL DIVISION CHAMPIONS
         * =====================================================
         */

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
         * =====================================================
         * MANAGER MAP
         * =====================================================
         */

        const managerMap = {};


        /*
         * Start with every manager appearing
         * anywhere in league history.
         */

        if (historyData.seasons) {

            historyData.seasons.forEach(
                season => {

                    season.teams.forEach(
                        team => {

                            if (!team.owner_id) {
                                return;
                            }


                            if (
                                !managerMap[
                                    team.owner_id
                                ]
                            ) {

                                managerMap[
                                    team.owner_id
                                ] = createManager(
                                    team.owner_id,
                                    team.owner
                                );

                            }


                            /*
                             * Keep Sleeper's latest
                             * available manager name.
                             */

                            managerMap[
                                team.owner_id
                            ].owner =
                                team.owner;


                            managerMap[
                                team.owner_id
                            ].seasonYears.add(
                                Number(
                                    season.season
                                )
                            );

                        }
                    );

                }
            );

        }


        /*
         * =====================================================
         * PERFORMANCE DATA
         * =====================================================
         */

        performanceData.forEach(
            seasonData => {

                if (!seasonData.managers) {
                    return;
                }


                seasonData.managers.forEach(
                    manager => {

                        if (
                            !managerMap[
                                manager.owner_id
                            ]
                        ) {

                            managerMap[
                                manager.owner_id
                            ] = createManager(
                                manager.owner_id,
                                manager.owner
                            );

                        }


                        const career =
                            managerMap[
                                manager.owner_id
                            ];


                        /*
                         * Regular season
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
                         * Playoffs
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


                        /*
                         * Biggest win
                         */

                        if (
                            manager.biggest_win &&
                            (
                                !career.biggest_win ||
                                manager.biggest_win.margin >
                                career.biggest_win.margin
                            )
                        ) {

                            career.biggest_win = {

                                ...manager.biggest_win

                            };

                        }


                       /*
 * =====================================================
 * LONGEST REGULAR-SEASON WINNING STREAK
 * =====================================================
 *
 * Supports ties.
 *
 * Each season is evaluated independently, so a streak
 * cannot carry from the end of one season into the next.
 */

const winningStreaks = [];


matchupData.forEach(
    seasonEntry => {

        const season =
            seasonEntry.season;


        const games =
            (
                seasonEntry.data.games ||
                []
            )
                .filter(
                    game =>
                        !game.playoff
                )
                .sort(
                    (a, b) =>
                        Number(a.week) -
                        Number(b.week)
                );


        const managerResults =
            {};


        games.forEach(
            game => {

                const team1 =
                    game.team_1;


                const team2 =
                    game.team_2;


                if (
                    !team1 ||
                    !team2
                ) {

                    return;

                }


                if (
                    !managerResults[
                        team1.owner_id
                    ]
                ) {

                    managerResults[
                        team1.owner_id
                    ] = {

                        owner_id:
                            team1.owner_id,

                        owner:
                            team1.owner,

                        results:
                            []

                    };

                }


                if (
                    !managerResults[
                        team2.owner_id
                    ]
                ) {

                    managerResults[
                        team2.owner_id
                    ] = {

                        owner_id:
                            team2.owner_id,

                        owner:
                            team2.owner,

                        results:
                            []

                    };

                }


                const team1Points =
                    Number(
                        team1.points ||
                        0
                    );


                const team2Points =
                    Number(
                        team2.points ||
                        0
                    );


                if (
                    team1Points >
                    team2Points
                ) {

                    managerResults[
                        team1.owner_id
                    ].results.push(
                        {
                            week:
                                Number(
                                    game.week
                                ),

                            result:
                                'W'
                        }
                    );


                    managerResults[
                        team2.owner_id
                    ].results.push(
                        {
                            week:
                                Number(
                                    game.week
                                ),

                            result:
                                'L'
                        }
                    );

                }

                else if (
                    team2Points >
                    team1Points
                ) {

                    managerResults[
                        team1.owner_id
                    ].results.push(
                        {
                            week:
                                Number(
                                    game.week
                                ),

                            result:
                                'L'
                        }
                    );


                    managerResults[
                        team2.owner_id
                    ].results.push(
                        {
                            week:
                                Number(
                                    game.week
                                ),

                            result:
                                'W'
                        }
                    );

                }

                else {

                    managerResults[
                        team1.owner_id
                    ].results.push(
                        {
                            week:
                                Number(
                                    game.week
                                ),

                            result:
                                'T'
                        }
                    );


                    managerResults[
                        team2.owner_id
                    ].results.push(
                        {
                            week:
                                Number(
                                    game.week
                                ),

                            result:
                                'T'
                        }
                    );

                }

            }
        );


        Object.values(
            managerResults
        ).forEach(
            manager => {

                manager.results.sort(
                    (a, b) =>
                        a.week -
                        b.week
                );


                let currentStreak =
                    0;


                let currentStartWeek =
                    null;


                let bestStreak =
                    0;


                let bestStartWeek =
                    null;


                let bestEndWeek =
                    null;


                manager.results.forEach(
                    result => {

                        if (
                            result.result ===
                            'W'
                        ) {

                            if (
                                currentStreak ===
                                0
                            ) {

                                currentStartWeek =
                                    result.week;

                            }


                            currentStreak++;


                            if (
                                currentStreak >
                                bestStreak
                            ) {

                                bestStreak =
                                    currentStreak;


                                bestStartWeek =
                                    currentStartWeek;


                                bestEndWeek =
                                    result.week;

                            }

                        }

                        else {

                            currentStreak =
                                0;


                            currentStartWeek =
                                null;

                        }

                    }
                );


                if (
                    bestStreak >
                    0
                ) {

                    winningStreaks.push(
                        {

                            owner_id:
                                manager.owner_id,

                            owner:
                                manager.owner,

                            season:
                                season,

                            streak:
                                bestStreak,

                            start_week:
                                bestStartWeek,

                            end_week:
                                bestEndWeek

                        }
                    );

                }

            }
        );

    }
);


const longestWinningStreak =
    winningStreaks.length > 0
        ? Math.max(
            ...winningStreaks.map(
                streak =>
                    streak.streak
            )
          )
        : 0;


const longestWinningStreakLeaders =
    winningStreaks.filter(
        streak =>
            streak.streak ===
            longestWinningStreak
    );

                        }

                    }

                );

            }
        );


        /*
         * =====================================================
         * CHAMPIONSHIP COUNTS
         * =====================================================
         */

        Object.entries(
            champions
        ).forEach(
            ([year, ownerId]) => {

                if (
                    managerMap[
                        ownerId
                    ]
                ) {

                    managerMap[
                        ownerId
                    ].championships++;

                }

            }
        );


        /*
         * =====================================================
         * DIVISION TITLE COUNTS
         * =====================================================
         */

        Object.values(
            historicalDivisionChampions
        ).forEach(
            ownerIds => {

                ownerIds.forEach(
                    ownerId => {

                        if (
                            managerMap[
                                ownerId
                            ]
                        ) {

                            managerMap[
                                ownerId
                            ].division_titles++;

                        }

                    }
                );

            }
        );


        /*
         * =====================================================
         * FINALIZE MANAGERS
         * =====================================================
         */

        const managers =
            Object.values(
                managerMap
            ).map(
                manager => {


                    manager.current =
                        currentOwnerIds.has(
                            manager.owner_id
                        );


                    manager.seasons =
                        manager.seasonYears.size;


                    /*
                     * Win percentage
                     */

                    if (
                        manager.regular_games > 0
                    ) {

                        manager.win_percentage =
                            (
                                (
                                    manager.regular_wins +
                                    (
                                        manager.regular_ties *
                                        0.5
                                    )
                                )
                                /
                                manager.regular_games
                            );

                    } else {

                        manager.win_percentage =
                            0;

                    }


                    /*
                     * Points per game
                     */

                    manager.ppg =
                        manager.regular_games > 0
                            ? (
                                manager.points_for /
                                manager.regular_games
                            )
                            : 0;


                    /*
                     * Points allowed per game
                     */

                    manager.papg =
                        manager.regular_games > 0
                            ? (
                                manager.points_against /
                                manager.regular_games
                            )
                            : 0;


                    return manager;

                }
            );


        /*
         * =====================================================
         * SORT MANAGER TABLE
         * =====================================================
         */

        managers.sort(
            (a, b) => {

                /*
                 * Current managers first.
                 */

                if (
                    a.current !==
                    b.current
                ) {

                    return a.current
                        ? -1
                        : 1;

                }


                /*
                 * Then by win percentage.
                 */

                if (
                    b.win_percentage !==
                    a.win_percentage
                ) {

                    return (
                        b.win_percentage -
                        a.win_percentage
                    );

                }


                /*
                 * Then by total wins.
                 */

                return (
                    b.regular_wins -
                    a.regular_wins
                );

            }
        );


        /*
         * =====================================================
         * BUILD MANAGER TABLE
         * =====================================================
         */

        tableBody.innerHTML = '';


        managers.forEach(
            manager => {


                const regularRecord =
                    formatRecord(

                        manager.regular_wins,

                        manager.regular_losses,

                        manager.regular_ties

                    );


                const playoffRecord =
                    formatRecord(

                        manager.playoff_wins,

                        manager.playoff_losses,

                        manager.playoff_ties

                    );


                const status =
                    manager.current
                        ? `
                            <span class="manager-status current">
                                Current
                            </span>
                          `
                        : `
                            <span class="manager-status former">
                                Former
                            </span>
                          `;


                const row =
                    document.createElement(
                        'tr'
                    );


                row.innerHTML = `

                    <td class="records-manager-name">
                        ${manager.owner}
                    </td>

                    <td>
                        ${status}
                    </td>

                    <td>
                        ${manager.seasons}
                    </td>

                    <td>
                        ${regularRecord}
                    </td>

                    <td>
                        ${
                            (
                                manager.win_percentage *
                                100
                            ).toFixed(1)
                        }%
                    </td>

                    <td>
                        ${manager.ppg.toFixed(2)}
                    </td>

                    <td>
                        ${manager.papg.toFixed(2)}
                    </td>

                    <td>
                        ${manager.championships}
                    </td>

                    <td>
                        ${manager.division_titles}
                    </td>

                    <td>
                        ${playoffRecord}
                    </td>

                `;


                tableBody.appendChild(
                    row
                );

            }
        );


        /*
         * =====================================================
         * LEAGUE LEADERS
         * =====================================================
         */

        const managersWithGames =
            managers.filter(
                manager =>
                    manager.regular_games > 0
            );


        /*
         * Most regular-season wins
         */

        const mostWins =
            [...managersWithGames]
                .sort(
                    (a, b) =>
                        b.regular_wins -
                        a.regular_wins
                )[0];


        /*
         * Best winning percentage
         */

        const bestWinningPercentage =
            [...managersWithGames]
                .sort(
                    (a, b) =>
                        b.win_percentage -
                        a.win_percentage
                )[0];


        /*
         * Highest career PPG
         */

        const highestPPG =
            [...managersWithGames]
                .sort(
                    (a, b) =>
                        b.ppg -
                        a.ppg
                )[0];


        /*
         * Highest team score ever
         */

        const highestTeamScoreManager =
            managers
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
         * Biggest blowout
         */

        const biggestWinManager =
            managers
                .filter(
                    manager =>
                        manager.biggest_win
                )
                .sort(
                    (a, b) =>
                        b.biggest_win.margin -
                        a.biggest_win.margin
                )[0];


        /*
         * Highest score in a loss
         */

        const highestLossManager =
            managers
                .filter(
                    manager =>
                        manager.highest_score_in_loss
                )
                .sort(
                    (a, b) =>
                        b.highest_score_in_loss.points -
                        a.highest_score_in_loss.points
                )[0];


        /*
         * Most championships
         *
         * Supports ties.
         */

        const championshipRecord =
            Math.max(
                ...managers.map(
                    manager =>
                        manager.championships
                )
            );


        const championshipLeaders =
            managers.filter(
                manager =>
                    manager.championships ===
                        championshipRecord &&
                    championshipRecord > 0
            );


        /*
         * Most division titles
         */

        const divisionTitleRecord =
            Math.max(
                ...managers.map(
                    manager =>
                        manager.division_titles
                )
            );


        const divisionTitleLeaders =
            managers.filter(
                manager =>
                    manager.division_titles ===
                        divisionTitleRecord &&
                    divisionTitleRecord > 0
            );


        /*
         * =====================================================
         * DISPLAY LEAGUE RECORD CARDS
         * =====================================================
         */

        recordsGrid.innerHTML = '';


        addRecordCard(
            recordsGrid,
            'Most Wins',
            mostWins
                ? mostWins.regular_wins
                : '—',
            mostWins
                ? mostWins.owner
                : '—'
        );


        addRecordCard(
            recordsGrid,
            'Best Win %',
            bestWinningPercentage
                ? (
                    bestWinningPercentage
                        .win_percentage *
                    100
                  ).toFixed(1) + '%'
                : '—',
            bestWinningPercentage
                ? bestWinningPercentage.owner
                : '—'
        );


        addRecordCard(
            recordsGrid,
            'Highest Career PPG',
            highestPPG
                ? highestPPG.ppg.toFixed(2)
                : '—',
            highestPPG
                ? highestPPG.owner
                : '—'
        );


        addRecordCard(
            recordsGrid,
            'Highest Team Score',
            highestTeamScoreManager
                ? highestTeamScoreManager
                    .highest_team_score
                    .points
                    .toFixed(2)
                : '—',
            highestTeamScoreManager
                ? `
                    ${highestTeamScoreManager.owner}
                    • Week
                    ${highestTeamScoreManager.highest_team_score.week},
                    ${highestTeamScoreManager.highest_team_score.season}
                  `
                : '—'
        );


        addRecordCard(
            recordsGrid,
            'Biggest Blowout',
            biggestWinManager
                ? biggestWinManager
                    .biggest_win
                    .margin
                    .toFixed(2)
                : '—',
            biggestWinManager
                ? `
                    ${biggestWinManager.owner}
                    over
                    ${biggestWinManager.biggest_win.opponent || 'Unknown'}
                    •
                    ${biggestWinManager.biggest_win.score.toFixed(2)}
                    -
                    ${biggestWinManager.biggest_win.opponent_score.toFixed(2)}
                    • Week
                    ${biggestWinManager.biggest_win.week},
                    ${biggestWinManager.biggest_win.season}
                  `
                : '—'
        );


addRecordCard(
    recordsGrid,

    'Longest Winning Streak',

    longestWinningStreak > 0
        ? `${longestWinningStreak} Games`
        : '—',

    longestWinningStreakLeaders.length > 0
        ? longestWinningStreakLeaders
            .map(
                streak => {

                    const manager =
                        managerMap[
                            streak.owner_id
                        ];


                    const owner =
                        manager
                            ? manager.owner
                            : streak.owner;


                    const weeks =
                        streak.start_week ===
                        streak.end_week
                            ? `Week ${streak.start_week}`
                            : `Weeks ${streak.start_week}-${streak.end_week}`;


                    return `
                        ${owner}
                        • ${streak.season}
                        • ${weeks}
                    `;

                }
            )
            .join(
                '<br>'
            )
        : '—'
);


        addRecordCard(
            recordsGrid,
            'Most Championships',
            championshipRecord > 0
                ? championshipRecord
                : '—',
            championshipLeaders.length > 0
                ? championshipLeaders
                    .map(
                        manager =>
                            manager.owner
                    )
                    .join(' • ')
                : '—'
        );


        addRecordCard(
            recordsGrid,
            'Most Division Titles',
            divisionTitleRecord > 0
                ? divisionTitleRecord
                : '—',
            divisionTitleLeaders.length > 0
                ? divisionTitleLeaders
                    .map(
                        manager =>
                            manager.owner
                    )
                    .join(' • ')
                : '—'
        );


    } catch (error) {

        console.error(
            'Error loading records:',
            error
        );


        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    class="records-error"
                >
                    Unable to load manager records.
                </td>

            </tr>

        `;


        recordsGrid.innerHTML = `

            <div
                class="
                    record-loading
                    records-error
                "
            >
                Unable to load league records.
            </div>

        `;

    }

}



/*
 * ======================================================
 * CREATE MANAGER
 * ======================================================
 */

function createManager(
    ownerId,
    owner
) {

    return {

        owner_id:
            ownerId,

        owner:
            owner,

        current:
            false,

        seasonYears:
            new Set(),

        seasons:
            0,

        regular_wins:
            0,

        regular_losses:
            0,

        regular_ties:
            0,

        regular_games:
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

        win_percentage:
            0,

        ppg:
            0,

        papg:
            0,

        championships:
            0,

        division_titles:
            0,

        highest_team_score:
            null,

        biggest_win:
            null,

        highest_score_in_loss:
            null

    };

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


    if (ties > 0) {

        record +=
            `-${ties}`;

    }


    return record;

}



/*
 * ======================================================
 * CREATE RECORD CARD
 * ======================================================
 */

function addRecordCard(
    grid,
    label,
    value,
    detail
) {

    const card =
        document.createElement(
            'div'
        );


    card.className =
        'league-record-card';


    card.innerHTML = `

        <span class="league-record-label">
            ${label}
        </span>

        <strong class="league-record-value">
            ${value}
        </strong>

        <span class="league-record-holder">
            ${detail}
        </span>

    `;


    grid.appendChild(
        card
    );

}


loadRecords();
