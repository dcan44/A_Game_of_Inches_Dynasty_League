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
 * MATCHUP SCORE LOOKUP
 * =====================================================
 *
 * The manager-performance API correctly identifies the
 * biggest win and margin, but historical score fields can
 * be missing.
 *
 * This lookup lets us recover the actual score from the
 * matchup-history API using:
 *
 * season + week + owner ID
 * =====================================================
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
        window.LEAGUE_DATA &&
        typeof window.LEAGUE_DATA.getOwnerName ===
        'function'
            ? window.LEAGUE_DATA.getOwnerName(
                team2.owner_id,
                team2.owner ||
                'Unknown'
              )
            : (
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
        window.LEAGUE_DATA &&
        typeof window.LEAGUE_DATA.getOwnerName ===
        'function'
            ? window.LEAGUE_DATA.getOwnerName(
                team1.owner_id,
                team1.owner ||
                'Unknown'
              )
            : (
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
         * Add current managers first.
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
         *
         * This makes sure former managers remain in
         * the all-time Records page.
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


                        /*
                         * =====================================
                         * SEASONS PLAYED
                         * =====================================
                         */

                        career.seasons.add(
                            season
                        );


                        /*
                         * =====================================
                         * REGULAR-SEASON RECORD
                         * =====================================
                         */

                        const regularSeason =
                            manager.regular_season ||
                            {};


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
                         * =====================================
                         * PLAYOFF RECORD
                         * =====================================
                         */

                        const playoffs =
                            manager.playoffs ||
                            {};


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
                         * =====================================
                         * SCORING
                         * =====================================
                         */

                        const scoring =
                            manager.scoring ||
                            {};


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
                         * =====================================
                         * HIGHEST TEAM SCORE
                         * =====================================
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
 * =====================================
 * BIGGEST WIN
 * =====================================
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
        career.biggest_win.margin
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
         *
         * IMPORTANT:
         *
         * This is intentionally OUTSIDE the performanceData
         * loop above. It therefore runs only once.
         *
         * Each season is evaluated independently.
         * Playoff games are excluded.
         * A loss or tie ends the streak.
         * =====================================================
         */

        const winningStreaks =
            [];


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
                                    team1.owner,

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
                                team1OwnerId
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
                                team2OwnerId
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
                                team1OwnerId
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
                                team2OwnerId
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
                                team1OwnerId
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
                                team2OwnerId
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


        /*
         * =====================================================
         * CHAMPIONSHIP COUNTS
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


        Object.entries(
            champions
        ).forEach(
            ([year, ownerId]) => {

                const key =
                    String(
                        ownerId
                    );


                if (
                    managerMap[
                        key
                    ]
                ) {

                    managerMap[
                        key
                    ].championships++;


                    managerMap[
                        key
                    ].championship_years.push(
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


        Object.entries(
            historicalDivisionChampions
        ).forEach(
            ([year, ownerIds]) => {

                ownerIds.forEach(
                    ownerId => {

                        const key =
                            String(
                                ownerId
                            );


                        if (
                            managerMap[
                                key
                            ]
                        ) {

                            managerMap[
                                key
                            ].division_titles++;


                            managerMap[
                                key
                            ].division_title_years.push(
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
                            manager.regular_games > 0
                                ? (
                                    (
                                        manager.regular_wins +
                                        (
                                            manager.regular_ties *
                                            0.5
                                        )
                                    )
                                    /
                                    manager.regular_games
                                  )
                                : 0;


                        manager.ppg =
                            manager.regular_games > 0
                                ? (
                                    manager.points_for /
                                    manager.regular_games
                                  )
                                : 0;


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
                 * Then by wins.
                 */

                return (
                    b.regular_wins -
                    a.regular_wins
                );

            }
        );


       /*
 * =====================================================
 * BUILD MANAGER TABLES
 * =====================================================
 */

managerRecordsBody.innerHTML =
    '';


formerManagerRecordsBody.innerHTML =
    '';


/*
 * Reusable row builder.
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
                .toFixed(2)
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
                ).toFixed(1)
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


if (
    formerManagers.length ===
    0
) {

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

        const mostWinsRecord =
            managersWithGames.length > 0
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
         * Best winning percentage
         */

        const bestWinPercentageRecord =
            managersWithGames.length > 0
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
         * Highest career PPG
         */

        const highestPPGRecord =
            managersWithGames.length > 0
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
         * Highest team score ever
         */

        const managersWithHighScore =
            managers.filter(
                manager =>
                    manager.highest_team_score
            );


        const highestTeamScoreRecord =
            managersWithHighScore.length > 0
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
         * Biggest blowout
         */

        const managersWithBiggestWin =
            managers.filter(
                manager =>
                    manager.biggest_win
            );


        const biggestBlowoutRecord =
            managersWithBiggestWin.length > 0
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
         * Most championships
         */

        const championshipRecord =
            managers.length > 0
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
                    championshipRecord > 0
            );


        /*
         * Most division titles
         */

        const divisionTitleRecord =
            managers.length > 0
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
                    divisionTitleRecord > 0
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

            mostWinsRecord > 0
                ? mostWinsRecord
                : '—',

            mostWinsLeaders.length > 0
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

            bestWinPercentageLeaders.length > 0
                ? (
                    bestWinPercentageRecord *
                    100
                  ).toFixed(1) +
                  '%'
                : '—',

            bestWinPercentageLeaders.length > 0
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

            highestPPGLeaders.length > 0
                ? highestPPGRecord.toFixed(2)
                : '—',

            highestPPGLeaders.length > 0
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


        /*
         * Part 3 continues with:
         *
         * Highest Team Score
         * Biggest Blowout
         * Longest Winning Streak
         * Most Championships
         * Most Division Titles
         */

            addRecordCard(
            recordsGrid,

            'Highest Team Score',

            highestTeamScoreLeaders.length > 0
                ? highestTeamScoreRecord.toFixed(2)
                : '—',

            highestTeamScoreLeaders.length > 0
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

            biggestBlowoutLeaders.length > 0
                ? biggestBlowoutRecord.toFixed(2)
                : '—',

            biggestBlowoutLeaders.length > 0
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


        /*
         * =====================================================
         * LONGEST WINNING STREAK
         * =====================================================
         */

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
                                    String(
                                        streak.owner_id
                                    )
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
                    .join(
                        ' • '
                    )
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
                    .join(
                        ' • '
                    )
                : '—'
        );


    } catch (
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
 * CREATE MANAGER
 * ======================================================
 */

function createManager(
    ownerId,
    owner
) {

    const realOwnerName =
        window.LEAGUE_DATA &&
        typeof window.LEAGUE_DATA.getOwnerName ===
        'function'
            ? window.LEAGUE_DATA.getOwnerName(
                ownerId,
                owner
              )
            : owner;


    return {

        owner_id:
            ownerId,

        owner:
            realOwnerName,

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
