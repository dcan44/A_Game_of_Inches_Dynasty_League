async function loadRecords() {
    const recordsGrid =
        document.getElementById(
            'league-records-grid'
        );

    const managerRecordsBody =
        document.getElementById(
            'manager-records-body'
        );

    const formerManagerRecordsBody =
        document.getElementById(
            'former-manager-records-body'
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

            fetch(
                '/api/teams'
            ),

            fetch(
                '/api/history'
            ),

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


        for (
            const response
            of responses
        ) {

            if (
                !response.ok
            ) {

                throw new Error(
                    'Unable to retrieve league records.'
                );

            }

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
                season:
                    2023,

                data:
                    await matchups2023Response.json()
            },

            {
                season:
                    2024,

                data:
                    await matchups2024Response.json()
            },

            {
                season:
                    2025,

                data:
                    await matchups2025Response.json()
            },

            {
                season:
                    2026,

                data:
                    await matchups2026Response.json()
            }

        ];


        /*
         * =====================================================
         * MATCHUP SCORE LOOKUP
         * =====================================================
         *
         * Used to recover actual scores for Biggest Blowout.
         */

        const matchupScoreLookup =
            {};


        matchupData.forEach(
            seasonEntry => {

                const season =
                    Number(
                        seasonEntry.season
                    );


                const games =
                    seasonEntry.data.games ||
                    [];


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


                        const week =
                            Number(
                                game.week
                            );


                        const team1OwnerId =
                            String(
                                team1.owner_id
                            );


                        const team2OwnerId =
                            String(
                                team2.owner_id
                            );


                        matchupScoreLookup[
                            `${season}-${week}-${team1OwnerId}`
                        ] = {

                            points:
                                Number(
                                    team1.points ||
                                    0
                                ),

                            opponent_points:
                                Number(
                                    team2.points ||
                                    0
                                ),

                            opponent:
                                getRealOwnerName(
                                    team2.owner_id,
                                    team2.owner ||
                                    'Unknown'
                                )

                        };


                        matchupScoreLookup[
                            `${season}-${week}-${team2OwnerId}`
                        ] = {

                            points:
                                Number(
                                    team2.points ||
                                    0
                                ),

                            opponent_points:
                                Number(
                                    team1.points ||
                                    0
                                ),

                            opponent:
                                getRealOwnerName(
                                    team1.owner_id,
                                    team1.owner ||
                                    'Unknown'
                                )

                        };

                    }
                );

            }
        );


        /*
         * =====================================================
         * MANAGER MAP
         * =====================================================
         */

        const managerMap =
            {};


        /*
         * Add current managers.
         */

        (
            teamsData.teams ||
            []
        ).forEach(
            team => {

                const ownerId =
                    String(
                        team.owner_id
                    );


                if (
                    !managerMap[
                        ownerId
                    ]
                ) {

                    managerMap[
                        ownerId
                    ] =
                        createManager(
                            team.owner_id,
                            team.owner
                        );

                }

            }
        );


        /*
         * Add historical managers.
         */

        (
            historyData.seasons ||
            []
        ).forEach(
            seasonData => {

                (
                    seasonData.teams ||
                    []
                ).forEach(
                    team => {

                        const ownerId =
                            String(
                                team.owner_id
                            );


                        if (
                            !managerMap[
                                ownerId
                            ]
                        ) {

                            managerMap[
                                ownerId
                            ] =
                                createManager(
                                    team.owner_id,
                                    team.owner
                                );

                        }

                    }
                );

            }
        );


        /*
         * =====================================================
         * PROCESS MANAGER PERFORMANCE
         * =====================================================
         */

        performanceData.forEach(
            seasonData => {

                const season =
                    Number(
                        seasonData.season
                    );


                (
                    seasonData.managers ||
                    []
                ).forEach(
                    manager => {

                        const ownerId =
                            String(
                                manager.owner_id
                            );


                        if (
                            !managerMap[
                                ownerId
                            ]
                        ) {

                            managerMap[
                                ownerId
                            ] =
                                createManager(
                                    manager.owner_id,
                                    manager.owner
                                );

                        }


                        const career =
                            managerMap[
                                ownerId
                            ];


                        const regularSeason =
                            manager.regular_season ||
                            {};


                        const playoffs =
                            manager.playoffs ||
                            {};


                        const scoring =
                            manager.scoring ||
                            {};


                        /*
                         * Seasons played.
                         */

                        career.seasons.add(
                            season
                        );


                        /*
                         * Regular-season record.
                         */

                        career.regular_wins +=
                            Number(
                                regularSeason.wins ||
                                0
                            );


                        career.regular_losses +=
                            Number(
                                regularSeason.losses ||
                                0
                            );


                        career.regular_ties +=
                            Number(
                                regularSeason.ties ||
                                0
                            );


                        career.regular_games +=
                            Number(
                                regularSeason.games ||
                                0
                            );


                        /*
                         * Playoff record.
                         */

                        career.playoff_wins +=
                            Number(
                                playoffs.wins ||
                                0
                            );


                        career.playoff_losses +=
                            Number(
                                playoffs.losses ||
                                0
                            );


                        career.playoff_ties +=
                            Number(
                                playoffs.ties ||
                                0
                            );


                        career.playoff_games +=
                            Number(
                                playoffs.games ||
                                0
                            );


                        /*
                         * Scoring.
                         */

                        career.points_for +=
                            Number(
                                scoring.points_for ||
                                0
                            );


                        career.points_against +=
                            Number(
                                scoring.points_against ||
                                0
                            );


                        /*
                         * Highest team score.
                         */

                        if (
                            manager.highest_team_score
                        ) {

                            const score =
                                Number(
                                    manager
                                        .highest_team_score
                                        .points ||
                                    0
                                );


                            if (
                                !career.highest_team_score ||
                                score >
                                career
                                    .highest_team_score
                                    .points
                            ) {

                                career.highest_team_score = {

                                    points:
                                        score,

                                    week:
                                        Number(
                                            manager
                                                .highest_team_score
                                                .week
                                        ),

                                    season:
                                        season

                                };

                            }

                        }


                        /*
                         * Biggest win.
                         */

                        if (
                            manager.biggest_win
                        ) {

                            const margin =
                                Number(
                                    manager
                                        .biggest_win
                                        .margin ||
                                    0
                                );


                            const biggestWinWeek =
                                Number(
                                    manager
                                        .biggest_win
                                        .week
                                );


                            const matchupScore =
                                matchupScoreLookup[
                                    `${season}-${biggestWinWeek}-${ownerId}`
                                ];


                            if (
                                !career.biggest_win ||
                                margin >
                                career
                                    .biggest_win
                                    .margin
                            ) {

                                career.biggest_win = {

                                    margin:
                                        margin,

                                    points:
                                        matchupScore
                                            ? matchupScore.points
                                            : Number(
                                                manager
                                                    .biggest_win
                                                    .points ||
                                                manager
                                                    .biggest_win
                                                    .score ||
                                                0
                                              ),

                                    opponent_points:
                                        matchupScore
                                            ? matchupScore.opponent_points
                                            : Number(
                                                manager
                                                    .biggest_win
                                                    .opponent_points ||
                                                manager
                                                    .biggest_win
                                                    .opponent_score ||
                                                0
                                              ),

                                    opponent:
                                        matchupScore
                                            ? matchupScore.opponent
                                            : (
                                                manager
                                                    .biggest_win
                                                    .opponent ||
                                                'Unknown'
                                              ),

                                    week:
                                        biggestWinWeek,

                                    season:
                                        season

                                };

                            }

                        }

                    }
                );

            }
        );


        /*
         * =====================================================
         * LONGEST REGULAR-SEASON WINNING STREAK
         * =====================================================
         */

        const winningStreaks =
            [];


        matchupData.forEach(
            seasonEntry => {

                const season =
                    Number(
                        seasonEntry.season
                    );


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
                                Number(
                                    a.week
                                ) -
                                Number(
                                    b.week
                                )
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


                        const team1OwnerId =
                            String(
                                team1.owner_id
                            );


                        const team2OwnerId =
                            String(
                                team2.owner_id
                            );


                        if (
                            !managerResults[
                                team1OwnerId
                            ]
                        ) {

                            managerResults[
                                team1OwnerId
                            ] = {

                                owner_id:
                                    team1.owner_id,

                                owner:
                                    getRealOwnerName(
                                        team1.owner_id,
                                        team1.owner
                                    ),

                                results:
                                    []

                            };

                        }


                        if (
                            !managerResults[
                                team2OwnerId
                            ]
                        ) {

                            managerResults[
                                team2OwnerId
                            ] = {

                                owner_id:
                                    team2.owner_id,

                                owner:
                                    getRealOwnerName(
                                        team2.owner_id,
                                        team2.owner
                                    ),

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


                        const week =
                            Number(
                                game.week
                            );


                        if (
                            team1Points >
                            team2Points
                        ) {

                            managerResults[
                                team1OwnerId
                            ].results.push(
                                {
                                    week:
                                        week,

                                    result:
                                        'W'
                                }
                            );


                            managerResults[
                                team2OwnerId
                            ].results.push(
                                {
                                    week:
                                        week,

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
                                team1OwnerId
                            ].results.push(
                                {
                                    week:
                                        week,

                                    result:
                                        'L'
                                }
                            );


                            managerResults[
                                team2OwnerId
                            ].results.push(
                                {
                                    week:
                                        week,

                                    result:
                                        'W'
                                }
                            );

                        }

                        else {

                            managerResults[
                                team1OwnerId
                            ].results.push(
                                {
                                    week:
                                        week,

                                    result:
                                        'T'
                                }
                            );


                            managerResults[
                                team2OwnerId
                            ].results.push(
                                {
                                    week:
                                        week,

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
            winningStreaks.length >
            0
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


        /*
         * =====================================================
         * CHAMPIONSHIP COUNTS
         * =====================================================
         */

        const champions = {

            2023:
                '978544154789699584',

            2024:
                '978815135223525376',

            2025:
                '1060373241799262208'

        };


        Object.entries(
            champions
        ).forEach(
            ([year, ownerId]) => {

                const manager =
                    managerMap[
                        String(
                            ownerId
                        )
                    ];


                if (
                    manager
                ) {

                    manager.championships++;


                    manager
                        .championship_years
                        .push(
                            Number(
                                year
                            )
                        );

                }

            }
        );


        /*
         * =====================================================
         * DIVISION TITLE COUNTS
         * =====================================================
         */

        const historicalDivisionChampions = {

            2023: [
                '978544154789699584',
                '984495671757611008'
            ],

            2024: [
                '978544154789699584',
                '978815135223525376'
            ],

            2025: [
                '978544154789699584',
                '1060373241799262208'
            ]

        };


        Object.entries(
            historicalDivisionChampions
        ).forEach(
            ([year, ownerIds]) => {

                ownerIds.forEach(
                    ownerId => {

                        const manager =
                            managerMap[
                                String(
                                    ownerId
                                )
                            ];


                        if (
                            manager
                        ) {

                            manager.division_titles++;


                            manager
                                .division_title_years
                                .push(
                                    Number(
                                        year
                                    )
                                );

                        }

                    }
                );

            }
        );


        /*
         * =====================================================
         * CURRENT MANAGER IDS
         * =====================================================
         */

        const currentOwnerIds =
            new Set(
                (
                    teamsData.teams ||
                    []
                ).map(
                    team =>
                        String(
                            team.owner_id
                        )
                )
            );


        /*
         * =====================================================
         * FINALIZE MANAGERS
         * =====================================================
         */

        const managers =
            Object.values(
                managerMap
            )
                .map(
                    manager => {

                        manager.current =
                            currentOwnerIds.has(
                                String(
                                    manager.owner_id
                                )
                            );


                        manager.season_count =
                            manager.seasons.size;


                        manager.win_percentage =
                            manager.regular_games >
                            0
                                ? (
                                    manager.regular_wins +
                                    (
                                        manager.regular_ties *
                                        0.5
                                    )
                                  ) /
                                  manager.regular_games
                                : 0;


                        manager.ppg =
                            manager.regular_games >
                            0
                                ? manager.points_for /
                                  manager.regular_games
                                : 0;


                        manager.papg =
                            manager.regular_games >
                            0
                                ? manager.points_against /
                                  manager.regular_games
                                : 0;


                        return manager;

                    }
                );


        /*
         * Default order:
         * current first, then Win %, then wins.
         */

        managers.sort(
            (a, b) => {

                if (
                    a.current !==
                    b.current
                ) {

                    return a.current
                        ? -1
                        : 1;

                }


                if (
                    b.win_percentage !==
                    a.win_percentage
                ) {

                    return (
                        b.win_percentage -
                        a.win_percentage
                    );

                }


                return (
                    b.regular_wins -
                    a.regular_wins
                );

            }
        );


        /*
         * =====================================================
         * MANAGER TABLES
         * =====================================================
         */

        const currentManagers =
            managers.filter(
                manager =>
                    manager.current
            );


        const formerManagers =
            managers.filter(
                manager =>
                    !manager.current
            );


        renderManagerTable(
            managerRecordsBody,
            currentManagers
        );


        if (
            formerManagers.length >
            0
        ) {

            renderManagerTable(
                formerManagerRecordsBody,
                formerManagers
            );

        }

        else {

            formerManagerRecordsBody.innerHTML = `

                <tr>

                    <td
                        colspan="10"
                        class="records-empty"
                    >
                        No former managers.
                    </td>

                </tr>

            `;

        }


        /*
         * Activate sorting independently
         * for each manager table.
         */

        setupSortableManagerTable(
            managerRecordsBody,
            currentManagers
        );


        setupSortableManagerTable(
            formerManagerRecordsBody,
            formerManagers
        );


        /*
         * =====================================================
         * LEAGUE LEADERS
         * =====================================================
         */

        const managersWithGames =
            managers.filter(
                manager =>
                    manager.regular_games >
                    0
            );


        /*
         * Most Wins
         */

        const mostWinsRecord =
            managersWithGames.length >
            0
                ? Math.max(
                    ...managersWithGames.map(
                        manager =>
                            manager.regular_wins
                    )
                  )
                : 0;


        const mostWinsLeaders =
            managersWithGames.filter(
                manager =>
                    manager.regular_wins ===
                    mostWinsRecord
            );


        /*
         * Best Win %
         */

        const bestWinPercentageRecord =
            managersWithGames.length >
            0
                ? Math.max(
                    ...managersWithGames.map(
                        manager =>
                            manager.win_percentage
                    )
                  )
                : 0;


        const bestWinPercentageLeaders =
            managersWithGames.filter(
                manager =>
                    Math.abs(
                        manager.win_percentage -
                        bestWinPercentageRecord
                    ) <
                    0.000001
            );


        /*
         * Highest Career PPG
         */

        const highestPPGRecord =
            managersWithGames.length >
            0
                ? Math.max(
                    ...managersWithGames.map(
                        manager =>
                            manager.ppg
                    )
                  )
                : 0;


        const highestPPGLeaders =
            managersWithGames.filter(
                manager =>
                    Math.abs(
                        manager.ppg -
                        highestPPGRecord
                    ) <
                    0.000001
            );


        /*
         * Highest Team Score
         */

        const managersWithHighScore =
            managers.filter(
                manager =>
                    manager.highest_team_score
            );


        const highestTeamScoreRecord =
            managersWithHighScore.length >
            0
                ? Math.max(
                    ...managersWithHighScore.map(
                        manager =>
                            manager
                                .highest_team_score
                                .points
                    )
                  )
                : 0;


        const highestTeamScoreLeaders =
            managersWithHighScore.filter(
                manager =>
                    Math.abs(
                        manager
                            .highest_team_score
                            .points -
                        highestTeamScoreRecord
                    ) <
                    0.000001
            );


        /*
         * Biggest Blowout
         */

        const managersWithBiggestWin =
            managers.filter(
                manager =>
                    manager.biggest_win
            );


        const biggestBlowoutRecord =
            managersWithBiggestWin.length >
            0
                ? Math.max(
                    ...managersWithBiggestWin.map(
                        manager =>
                            manager
                                .biggest_win
                                .margin
                    )
                  )
                : 0;


        const biggestBlowoutLeaders =
            managersWithBiggestWin.filter(
                manager =>
                    Math.abs(
                        manager
                            .biggest_win
                            .margin -
                        biggestBlowoutRecord
                    ) <
                    0.000001
            );


        /*
         * Championships
         */

        const championshipRecord =
            managers.length >
            0
                ? Math.max(
                    ...managers.map(
                        manager =>
                            manager.championships
                    )
                  )
                : 0;


        const championshipLeaders =
            managers.filter(
                manager =>
                    manager.championships ===
                    championshipRecord &&
                    championshipRecord >
                    0
            );


        /*
         * Division Titles
         */

        const divisionTitleRecord =
            managers.length >
            0
                ? Math.max(
                    ...managers.map(
                        manager =>
                            manager.division_titles
                    )
                  )
                : 0;


        const divisionTitleLeaders =
            managers.filter(
                manager =>
                    manager.division_titles ===
                    divisionTitleRecord &&
                    divisionTitleRecord >
                    0
            );


        /*
         * =====================================================
         * DISPLAY LEAGUE RECORD CARDS
         * =====================================================
         */

        recordsGrid.innerHTML =
            '';


        addRecordCard(
            recordsGrid,

            'Most Wins',

            mostWinsRecord >
            0
                ? mostWinsRecord
                : '—',

            mostWinsLeaders.length >
            0
                ? mostWinsLeaders
                    .map(
                        manager =>
                            manager.owner
                    )
                    .join(
                        ' • '
                    )
                : '—'
        );


        addRecordCard(
            recordsGrid,

            'Best Win %',

            bestWinPercentageLeaders.length >
            0
                ? (
                    bestWinPercentageRecord *
                    100
                  ).toFixed(
                    1
                  ) +
                  '%'
                : '—',

            bestWinPercentageLeaders.length >
            0
                ? bestWinPercentageLeaders
                    .map(
                        manager =>
                            manager.owner
                    )
                    .join(
                        ' • '
                    )
                : '—'
        );


        addRecordCard(
            recordsGrid,

            'Highest Career PPG',

            highestPPGLeaders.length >
            0
                ? highestPPGRecord.toFixed(
                    2
                  )
                : '—',

            highestPPGLeaders.length >
            0
                ? highestPPGLeaders
                    .map(
                        manager =>
                            manager.owner
                    )
                    .join(
                        ' • '
                    )
                : '—'
        );


        addRecordCard(
            recordsGrid,

            'Highest Team Score',

            highestTeamScoreLeaders.length >
            0
                ? highestTeamScoreRecord.toFixed(
                    2
                  )
                : '—',

            highestTeamScoreLeaders.length >
            0
                ? highestTeamScoreLeaders
                    .map(
                        manager => {

                            return `

                                ${manager.owner}

                                • Week
                                ${manager.highest_team_score.week},

                                ${manager.highest_team_score.season}

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

            'Biggest Blowout',

            biggestBlowoutLeaders.length >
            0
                ? biggestBlowoutRecord.toFixed(
                    2
                  )
                : '—',

            biggestBlowoutLeaders.length >
            0
                ? biggestBlowoutLeaders
                    .map(
                        manager => {

                            const win =
                                manager.biggest_win;


                            return `

                                ${manager.owner}

                                over

                                ${win.opponent || 'Unknown'}

                                •

                                ${win.points.toFixed(2)}

                                -

                                ${win.opponent_points.toFixed(2)}

                                • Week
                                ${win.week},

                                ${win.season}

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

            'Longest Winning Streak',

            longestWinningStreak >
            0
                ? `${longestWinningStreak} Games`
                : '—',

            longestWinningStreakLeaders.length >
            0
                ? longestWinningStreakLeaders
                    .map(
                        streak => {

                            const weeks =
                                streak.start_week ===
                                streak.end_week
                                    ? `Week ${streak.start_week}`
                                    : `Weeks ${streak.start_week}-${streak.end_week}`;


                            return `

                                ${getRealOwnerName(
                                    streak.owner_id,
                                    streak.owner
                                )}

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

            championshipRecord >
            0
                ? championshipRecord
                : '—',

            championshipLeaders.length >
            0
                ? championshipLeaders
                    .map(
                        manager =>
                            manager.owner
                    )
                    .join(
                        ' • '
                    )
                : '—'
        );


        addRecordCard(
            recordsGrid,

            'Most Division Titles',

            divisionTitleRecord >
            0
                ? divisionTitleRecord
                : '—',

            divisionTitleLeaders.length >
            0
                ? divisionTitleLeaders
                    .map(
                        manager =>
                            manager.owner
                    )
                    .join(
                        ' • '
                    )
                : '—'
        );

    }

    catch (
        error
    ) {

        console.error(
            'Error loading records:',
            error
        );


        if (
            managerRecordsBody
        ) {

            managerRecordsBody.innerHTML = `

                <tr>

                    <td
                        colspan="10"
                        class="records-error"
                    >
                        Unable to load manager records.
                    </td>

                </tr>

            `;

        }


        if (
            formerManagerRecordsBody
        ) {

            formerManagerRecordsBody.innerHTML = `

                <tr>

                    <td
                        colspan="10"
                        class="records-error"
                    >
                        Unable to load former manager records.
                    </td>

                </tr>

            `;

        }


        if (
            recordsGrid
        ) {

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

}


/*
 * ======================================================
 * OWNER NAME HELPER
 * ======================================================
 */

function getRealOwnerName(
    ownerId,
    fallback = 'Unknown Manager'
) {

    if (
        window.LEAGUE_DATA &&
        typeof window.LEAGUE_DATA.getOwnerName ===
        'function'
    ) {

        return window.LEAGUE_DATA.getOwnerName(
            ownerId,
            fallback
        );

    }


    return fallback;

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
            getRealOwnerName(
                ownerId,
                owner
            ),

        current:
            false,

        seasons:
            new Set(),

        season_count:
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

        playoff_games:
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

        championship_years:
            [],

        division_titles:
            0,

        division_title_years:
            [],

        highest_team_score:
            null,

        biggest_win:
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


    if (
        ties >
        0
    ) {

        record +=
            `-${ties}`;

    }


    return record;

}


/*
 * ======================================================
 * BUILD MANAGER ROW
 * ======================================================
 */

function buildManagerRecordRow(
    manager
) {

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


    const highestCareerGame =
        manager.highest_team_score
            ? manager
                .highest_team_score
                .points
                .toFixed(
                    2
                )
            : '—';


    const row =
        document.createElement(
            'tr'
        );


    row.innerHTML = `

        <td class="records-manager-name">
            ${manager.owner}
        </td>

        <td>
            ${manager.season_count}
        </td>

        <td>
            ${regularRecord}
        </td>

        <td>
            ${
                (
                    manager.win_percentage *
                    100
                ).toFixed(
                    1
                )
            }%
        </td>

        <td>
            ${manager.ppg.toFixed(2)}
        </td>

        <td>
            ${manager.points_for.toFixed(2)}
        </td>

        <td>
            ${highestCareerGame}
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


    return row;

}


/*
 * ======================================================
 * RENDER MANAGER TABLE
 * ======================================================
 */

function renderManagerTable(
    body,
    managerList
) {

    body.innerHTML =
        '';


    managerList.forEach(
        manager => {

            body.appendChild(
                buildManagerRecordRow(
                    manager
                )
            );

        }
    );

}


/*
 * ======================================================
 * MANAGER TABLE SORTING
 * ======================================================
 */

function compareManagerRows(
    a,
    b,
    columnIndex,
    direction
) {

    let comparison =
        0;


    switch (
        columnIndex
    ) {


        /*
         * Manager
         */

        case 0:

            comparison =
                a.owner.localeCompare(
                    b.owner
                );

            break;


        /*
         * Seasons
         */

        case 1:

            comparison =
                a.season_count -
                b.season_count;

            break;


        /*
         * Regular Season
         *
         * Wins first.
         * Then fewer losses.
         * Then ties.
         */

        case 2:

            comparison =
                a.regular_wins -
                b.regular_wins;


            if (
                comparison ===
                0
            ) {

                comparison =
                    b.regular_losses -
                    a.regular_losses;

            }


            if (
                comparison ===
                0
            ) {

                comparison =
                    a.regular_ties -
                    b.regular_ties;

            }

            break;


        /*
         * Win %
         */

        case 3:

            comparison =
                a.win_percentage -
                b.win_percentage;

            break;


        /*
         * PPG
         */

        case 4:

            comparison =
                a.ppg -
                b.ppg;

            break;


        /*
         * Total PF
         */

        case 5:

            comparison =
                a.points_for -
                b.points_for;

            break;


        /*
         * Highest Career Game
         */

        case 6: {

            const aScore =
                a.highest_team_score
                    ? a
                        .highest_team_score
                        .points
                    : 0;


            const bScore =
                b.highest_team_score
                    ? b
                        .highest_team_score
                        .points
                    : 0;


            comparison =
                aScore -
                bScore;

            break;

        }


        /*
         * Titles
         */

        case 7:

            comparison =
                a.championships -
                b.championships;

            break;


        /*
         * Division Titles
         */

        case 8:

            comparison =
                a.division_titles -
                b.division_titles;

            break;


        /*
         * Playoffs
         *
         * Wins first.
         * Then fewer losses.
         * Then ties.
         */

        case 9:

            comparison =
                a.playoff_wins -
                b.playoff_wins;


            if (
                comparison ===
                0
            ) {

                comparison =
                    b.playoff_losses -
                    a.playoff_losses;

            }


            if (
                comparison ===
                0
            ) {

                comparison =
                    a.playoff_ties -
                    b.playoff_ties;

            }

            break;


        default:

            comparison =
                0;

    }


    /*
     * Alphabetical tiebreaker.
     */

    if (
        comparison ===
        0
    ) {

        comparison =
            a.owner.localeCompare(
                b.owner
            );

    }


    return direction ===
        'asc'
            ? comparison
            : -comparison;

}


/*
 * ======================================================
 * ACTIVATE SORTING FOR A MANAGER TABLE
 * ======================================================
 */

function setupSortableManagerTable(
    body,
    managerList
) {

    const table =
        body.closest(
            '.manager-records-table'
        );


    if (
        !table
    ) {

        return;

    }


    const headers =
        Array.from(
            table.querySelectorAll(
                'thead th'
            )
        );


    const labels =
        headers.map(
            header =>
                header.textContent.trim()
        );


    let activeColumn =
        null;


    let direction =
        null;


    headers.forEach(
        (
            header,
            columnIndex
        ) => {

            header.style.cursor =
                'pointer';


            header.setAttribute(
                'role',
                'button'
            );


            header.setAttribute(
                'tabindex',
                '0'
            );


            header.setAttribute(
                'aria-sort',
                'none'
            );


            const sortColumn =
                () => {

                    /*
                     * Same column:
                     * reverse direction.
                     */

                    if (
                        activeColumn ===
                        columnIndex
                    ) {

                        direction =
                            direction ===
                            'asc'
                                ? 'desc'
                                : 'asc';

                    }


                    /*
                     * New column:
                     *
                     * Manager starts A-Z.
                     * Statistics start high-low.
                     */

                    else {

                        activeColumn =
                            columnIndex;


                        direction =
                            columnIndex ===
                            0
                                ? 'asc'
                                : 'desc';

                    }


                    const sortedManagers =
                        [
                            ...managerList
                        ]
                            .sort(
                                (
                                    a,
                                    b
                                ) =>
                                    compareManagerRows(
                                        a,
                                        b,
                                        columnIndex,
                                        direction
                                    )
                            );


                    renderManagerTable(
                        body,
                        sortedManagers
                    );


                    /*
                     * Reset all header labels.
                     */

                    headers.forEach(
                        (
                            currentHeader,
                            index
                        ) => {

                            currentHeader.textContent =
                                labels[
                                    index
                                ];


                            currentHeader.setAttribute(
                                'aria-sort',

                                index ===
                                activeColumn

                                    ? (
                                        direction ===
                                        'asc'

                                            ? 'ascending'

                                            : 'descending'
                                      )

                                    : 'none'
                            );

                        }
                    );


                    /*
                     * Add arrow to active column.
                     */

                    header.textContent =
                        `${
                            labels[
                                columnIndex
                            ]
                        } ${
                            direction ===
                            'asc'
                                ? '▲'
                                : '▼'
                        }`;

                };


            /*
             * Mouse click.
             */

            header.addEventListener(
                'click',
                sortColumn
            );


            /*
             * Keyboard support.
             */

            header.addEventListener(
                'keydown',
                event => {

                    if (
                        event.key ===
                            'Enter' ||
                        event.key ===
                            ' '
                    ) {

                        event.preventDefault();


                        sortColumn();

                    }

                }
            );

        }
    );

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


/*
 * ======================================================
 * INITIAL LOAD
 * ======================================================
 */

loadRecords();
