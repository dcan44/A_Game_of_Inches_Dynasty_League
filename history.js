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
        team_name:
            "Rollin with Ma-Homies"
    },

    2024: {
        owner_id:
            "978815135223525376",
        team_name:
            "Goats"
    },

    2025: {
        owner_id:
            "1060373241799262208",
        team_name:
            "Big Dog"
    }

};


/*
 * ======================================================
 * OWNER NAME HELPER
 * ======================================================
 */

function getLeagueOwnerName(
    ownerId,
    fallback = "Unknown Manager"
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
 * LOAD CHAMPION PENNANTS
 * ======================================================
 */

function loadChampionPennants() {

    historyChampions.innerHTML = '';


    Object.entries(
        confirmedChampions
    ).forEach(
        ([year, champion]) => {

            const ownerName =
                getLeagueOwnerName(
                    champion.owner_id,
                    "Unknown Manager"
                );


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
                    🏆
                </div>

                <div class="history-pennant-title">
                    Champion
                </div>

                <div class="history-pennant-team">
                    ${champion.team_name}
                </div>

                <div class="history-pennant-owner">
                    ${ownerName}
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
            bracketResponse,
            rostersResponse,
            matchupHistoryResponse
        ] = await Promise.all([

            fetch(
                '/api/history'
            ),

            fetch(
                `/api/manager-performance?season=${season}`
            ),

            fetch(
                `https://api.sleeper.app/v1/league/${leagueId}/winners_bracket`
            ),

            fetch(
                `https://api.sleeper.app/v1/league/${leagueId}/rosters`
            ),

            fetch(
                `/api/matchup-history?season=${season}`
            )

        ]);


        if (
            !historyResponse.ok ||
            !performanceResponse.ok ||
            !bracketResponse.ok ||
            !rostersResponse.ok ||
            !matchupHistoryResponse.ok
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


        const sleeperRosters =
            await rostersResponse.json();


        const matchupHistoryData =
            await matchupHistoryResponse.json();

/*
 * =====================================================
 * TOILET BOWL LOSER
 * =====================================================
 *
 * Used only to mark the Hall of Shame loser.
 * This does NOT affect Final Standings rank.
 */

let toiletBowlLoserRosterId =
    null;


try {

    const losersBracketResponse =
        await fetch(
            `https://api.sleeper.app/v1/league/${seasonData.league_id}/losers_bracket`
        );


    if (
        losersBracketResponse.ok
    ) {

        const losersBracket =
            await losersBracketResponse.json();


        if (
            losersBracket.length >
            0
        ) {

            const finalRound =
                Math.max(
                    ...losersBracket.map(
                        game =>
                            game.r ||
                            0
                    )
                );


            const toiletBowlFinal =
                losersBracket.find(
                    game =>
                        game.r === finalRound &&
                        game.p === 1
                );


            if (
                toiletBowlFinal
            ) {

                toiletBowlLoserRosterId =
                    Number(
                        toiletBowlFinal.w
                    );

            }

        }

    }

}
catch (
    error
) {

    console.warn(
        'Unable to determine Toilet Bowl loser:',
        error
    );

}       

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


        if (
            !seasonData
        ) {

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


        const fifthPlaceGame =
    bracketData.find(
        game =>
            game.p === 5
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


        const fourthPlace =
    thirdPlaceGame
        ? rosterMap[
            thirdPlaceGame.l
          ]
        : null;


const fifthPlace =
    fifthPlaceGame
        ? rosterMap[
            fifthPlaceGame.w
          ]
        : null;


const sixthPlace =
    fifthPlaceGame
        ? rosterMap[
            fifthPlaceGame.l
          ]
        : null;
        

        const championOwnerName =
            champion
                ? getLeagueOwnerName(
                    champion.owner_id,
                    champion.owner
                )
                : getLeagueOwnerName(
                    confirmedChampions[
                        season
                    ]?.owner_id,
                    "Unknown Manager"
                );


        const runnerUpOwnerName =
            runnerUp
                ? getLeagueOwnerName(
                    runnerUp.owner_id,
                    runnerUp.owner
                )
                : '—';


        const thirdPlaceOwnerName =
            thirdPlace
                ? getLeagueOwnerName(
                    thirdPlace.owner_id,
                    thirdPlace.owner
                )
                : '—';


        /*
         * =====================================================
         * MANAGER PERFORMANCE LOOKUP
         * =====================================================
         */

        const managers =
            performanceData.managers || [];


        const managerMap = {};


        managers.forEach(
            manager => {

                managerMap[
                    manager.owner_id
                ] = manager;

            }
        );


        /*
         * =====================================================
         * SLEEPER PF / MAX PF / EFFICIENCY
         * =====================================================
         */

        const efficiencyData = [];


        sleeperRosters.forEach(
            roster => {

                if (
                    !roster.owner_id ||
                    !roster.settings
                ) {

                    return;

                }


                const actualPF =
                    sleeperPoints(
                        roster.settings.fpts,
                        roster.settings.fpts_decimal
                    );


                const maxPF =
                    sleeperPoints(
                        roster.settings.ppts,
                        roster.settings.ppts_decimal
                    );


                if (
                    maxPF <= 0
                ) {

                    return;

                }


                efficiencyData.push(
                    {
                        owner_id:
                            roster.owner_id,

                        owner:
                            managerMap[
                                roster.owner_id
                            ]?.owner ||
                            rosterMap[
                                roster.roster_id
                            ]?.owner ||
                            'Unknown Manager',

                        actual_pf:
                            actualPF,

                        max_pf:
                            maxPF,

                        efficiency:
                            roundTo(
                                (
                                    actualPF /
                                    maxPF
                                ) * 100,
                                2
                            )
                    }
                );

            }
        );


        /*
         * =====================================================
         * REGULAR-SEASON GAME DATA
         * =====================================================
         *
         * Season Leaders / Losers are regular-season awards.
         * Playoff and consolation games are excluded here.
         */

        const regularSeasonGames =
            (
                matchupHistoryData.games || []
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


        const gameStats = {};


        function ensureGameStats(
            team
        ) {

            if (
                !team ||
                !team.owner_id
            ) {

                return null;

            }


            if (
                !gameStats[
                    team.owner_id
                ]
            ) {

                gameStats[
                    team.owner_id
                ] = {

                    owner_id:
                        team.owner_id,

                    owner:
                        team.owner ||
                        managerMap[
                            team.owner_id
                        ]?.owner ||
                        'Unknown Manager',

                    scores:
                        [],

                    wins:
                        [],

                    losses:
                        [],

                    weekly_results:
                        []

                };

            }


            return gameStats[
                team.owner_id
            ];

        }


        regularSeasonGames.forEach(
            game => {

                const first =
                    game.team_1;

                const second =
                    game.team_2;


                if (
                    !first ||
                    !second
                ) {

                    return;

                }


                const firstStats =
                    ensureGameStats(
                        first
                    );


                const secondStats =
                    ensureGameStats(
                        second
                    );


                if (
                    !firstStats ||
                    !secondStats
                ) {

                    return;

                }


                const firstPoints =
                    Number(
                        first.points || 0
                    );


                const secondPoints =
                    Number(
                        second.points || 0
                    );


                firstStats.scores.push(
                    {
                        points:
                            firstPoints,
                        opponent_points:
                            secondPoints,
                        opponent_owner_id:
                            second.owner_id,
                        opponent:
                            second.owner,
                        week:
                            Number(game.week)
                    }
                );


                secondStats.scores.push(
                    {
                        points:
                            secondPoints,
                        opponent_points:
                            firstPoints,
                        opponent_owner_id:
                            first.owner_id,
                        opponent:
                            first.owner,
                        week:
                            Number(game.week)
                    }
                );


                if (
                    firstPoints >
                    secondPoints
                ) {

                    const margin =
                        roundTo(
                            firstPoints -
                            secondPoints,
                            2
                        );


                    firstStats.wins.push(
                        {
                            points:
                                firstPoints,
                            opponent_points:
                                secondPoints,
                            opponent_owner_id:
                                second.owner_id,
                            opponent:
                                second.owner,
                            margin:
                                margin,
                            week:
                                Number(game.week)
                        }
                    );


                    secondStats.losses.push(
                        {
                            points:
                                secondPoints,
                            opponent_points:
                                firstPoints,
                            opponent_owner_id:
                                first.owner_id,
                            opponent:
                                first.owner,
                            margin:
                                margin,
                            week:
                                Number(game.week)
                        }
                    );


                    firstStats.weekly_results.push(
                        {
                            week:
                                Number(game.week),
                            result:
                                'W'
                        }
                    );


                    secondStats.weekly_results.push(
                        {
                            week:
                                Number(game.week),
                            result:
                                'L'
                        }
                    );

                }

                else if (
                    secondPoints >
                    firstPoints
                ) {

                    const margin =
                        roundTo(
                            secondPoints -
                            firstPoints,
                            2
                        );


                    secondStats.wins.push(
                        {
                            points:
                                secondPoints,
                            opponent_points:
                                firstPoints,
                            opponent_owner_id:
                                first.owner_id,
                            opponent:
                                first.owner,
                            margin:
                                margin,
                            week:
                                Number(game.week)
                        }
                    );


                    firstStats.losses.push(
                        {
                            points:
                                firstPoints,
                            opponent_points:
                                secondPoints,
                            opponent_owner_id:
                                second.owner_id,
                            opponent:
                                second.owner,
                            margin:
                                margin,
                            week:
                                Number(game.week)
                        }
                    );


                    secondStats.weekly_results.push(
                        {
                            week:
                                Number(game.week),
                            result:
                                'W'
                        }
                    );


                    firstStats.weekly_results.push(
                        {
                            week:
                                Number(game.week),
                            result:
                                'L'
                        }
                    );

                }

                else {

                    firstStats.weekly_results.push(
                        {
                            week:
                                Number(game.week),
                            result:
                                'T'
                        }
                    );


                    secondStats.weekly_results.push(
                        {
                            week:
                                Number(game.week),
                            result:
                                'T'
                        }
                    );

                }

            }
        );


        const gameStatManagers =
            Object.values(
                gameStats
            );


        gameStatManagers.forEach(
            manager => {

                manager.weekly_results.sort(
                    (a, b) =>
                        a.week -
                        b.week
                );


                manager.longest_winning_streak =
                    longestStreak(
                        manager.weekly_results,
                        'W'
                    );


                manager.longest_losing_streak =
                    longestStreak(
                        manager.weekly_results,
                        'L'
                    );

            }
        );
                /*
         * =====================================================
         * MOST / FEWEST WINS
         * =====================================================
         */

        const mostWinsValue =
            managers.length
                ? Math.max(
                    ...managers.map(
                        manager =>
                            Number(
                                manager
                                    .regular_season
                                    .wins || 0
                            )
                    )
                )
                : 0;


        const fewestWinsValue =
            managers.length
                ? Math.min(
                    ...managers.map(
                        manager =>
                            Number(
                                manager
                                    .regular_season
                                    .wins || 0
                            )
                    )
                )
                : 0;


        const mostWinsManagers =
            managers.filter(
                manager =>
                    Number(
                        manager
                            .regular_season
                            .wins || 0
                    ) ===
                    mostWinsValue
            );


        const fewestWinsManagers =
            managers.filter(
                manager =>
                    Number(
                        manager
                            .regular_season
                            .wins || 0
                    ) ===
                    fewestWinsValue
            );


        /*
         * =====================================================
         * HIGHEST / LOWEST PPG
         * =====================================================
         */

        const managersWithGames =
            managers.filter(
                manager =>
                    Number(
                        manager
                            .regular_season
                            .games || 0
                    ) > 0
            );


        const highestPPGValue =
            managersWithGames.length
                ? Math.max(
                    ...managersWithGames.map(
                        manager =>
                            Number(
                                manager
                                    .scoring
                                    .points_per_game || 0
                            )
                    )
                )
                : 0;


        const lowestPPGValue =
            managersWithGames.length
                ? Math.min(
                    ...managersWithGames.map(
                        manager =>
                            Number(
                                manager
                                    .scoring
                                    .points_per_game || 0
                            )
                    )
                )
                : 0;


        const highestPPGManagers =
            managersWithGames.filter(
                manager =>
                    nearlyEqual(
                        Number(
                            manager
                                .scoring
                                .points_per_game || 0
                        ),
                        highestPPGValue
                    )
            );


        const lowestPPGManagers =
            managersWithGames.filter(
                manager =>
                    nearlyEqual(
                        Number(
                            manager
                                .scoring
                                .points_per_game || 0
                        ),
                        lowestPPGValue
                    )
            );


        /*
         * =====================================================
         * HIGHEST / LOWEST SINGLE-GAME SCORE
         * =====================================================
         */

        const allScores =
            gameStatManagers.flatMap(
                manager =>
                    manager.scores.map(
                        score => ({
                            ...score,
                            owner_id:
                                manager.owner_id,
                            owner:
                                manager.owner
                        })
                    )
            );


        const highestSingleGameValue =
            allScores.length
                ? Math.max(
                    ...allScores.map(
                        score =>
                            score.points
                    )
                )
                : 0;


        const lowestSingleGameValue =
            allScores.length
                ? Math.min(
                    ...allScores.map(
                        score =>
                            score.points
                    )
                )
                : 0;


        const highestSingleGames =
            allScores.filter(
                score =>
                    nearlyEqual(
                        score.points,
                        highestSingleGameValue
                    )
            );


        const lowestSingleGames =
            allScores.filter(
                score =>
                    nearlyEqual(
                        score.points,
                        lowestSingleGameValue
                    )
            );


        /*
         * =====================================================
         * MOST / FEWEST TOTAL POINTS FOR
         * =====================================================
         */

        const mostPointsForValue =
            seasonData.teams.length
                ? Math.max(
                    ...seasonData.teams.map(
                        team =>
                            Number(
                                team.points_for || 0
                            )
                    )
                )
                : 0;


        const fewestPointsForValue =
            seasonData.teams.length
                ? Math.min(
                    ...seasonData.teams.map(
                        team =>
                            Number(
                                team.points_for || 0
                            )
                    )
                )
                : 0;


        const mostPointsForTeams =
            seasonData.teams.filter(
                team =>
                    nearlyEqual(
                        Number(
                            team.points_for || 0
                        ),
                        mostPointsForValue
                    )
            );


        const fewestPointsForTeams =
            seasonData.teams.filter(
                team =>
                    nearlyEqual(
                        Number(
                            team.points_for || 0
                        ),
                        fewestPointsForValue
                    )
            );


        /*
         * =====================================================
         * MOST / LEAST EFFICIENT
         * =====================================================
         */

        const highestEfficiencyValue =
            efficiencyData.length
                ? Math.max(
                    ...efficiencyData.map(
                        manager =>
                            manager.efficiency
                    )
                )
                : 0;


        const lowestEfficiencyValue =
            efficiencyData.length
                ? Math.min(
                    ...efficiencyData.map(
                        manager =>
                            manager.efficiency
                    )
                )
                : 0;


        const mostEfficientManagers =
            efficiencyData.filter(
                manager =>
                    nearlyEqual(
                        manager.efficiency,
                        highestEfficiencyValue
                    )
            );


        const leastEfficientManagers =
            efficiencyData.filter(
                manager =>
                    nearlyEqual(
                        manager.efficiency,
                        lowestEfficiencyValue
                    )
            );


        /*
         * =====================================================
         * LONGEST WINNING / LOSING STREAK
         * =====================================================
         */

        const longestWinningStreakValue =
            gameStatManagers.length
                ? Math.max(
                    ...gameStatManagers.map(
                        manager =>
                            manager
                                .longest_winning_streak
                    )
                )
                : 0;


        const longestLosingStreakValue =
            gameStatManagers.length
                ? Math.max(
                    ...gameStatManagers.map(
                        manager =>
                            manager
                                .longest_losing_streak
                    )
                )
                : 0;


        const longestWinningStreakManagers =
            gameStatManagers.filter(
                manager =>
                    manager
                        .longest_winning_streak ===
                    longestWinningStreakValue
            );


        const longestLosingStreakManagers =
            gameStatManagers.filter(
                manager =>
                    manager
                        .longest_losing_streak ===
                    longestLosingStreakValue
            );


        /*
         * =====================================================
         * LOWEST SCORE IN A WIN
         * =====================================================
         */

        const allWins =
            gameStatManagers.flatMap(
                manager =>
                    manager.wins.map(
                        win => ({
                            ...win,
                            owner_id:
                                manager.owner_id,
                            owner:
                                manager.owner
                        })
                    )
            );


        const lowestWinningScoreValue =
            allWins.length
                ? Math.min(
                    ...allWins.map(
                        win =>
                            win.points
                    )
                )
                : 0;


        const lowestWinningScores =
            allWins.filter(
                win =>
                    nearlyEqual(
                        win.points,
                        lowestWinningScoreValue
                    )
            );


        /*
         * =====================================================
         * HIGHEST SCORE IN A LOSS
         * =====================================================
         */

        const allLosses =
            gameStatManagers.flatMap(
                manager =>
                    manager.losses.map(
                        loss => ({
                            ...loss,
                            owner_id:
                                manager.owner_id,
                            owner:
                                manager.owner
                        })
                    )
            );


        const highestLosingScoreValue =
            allLosses.length
                ? Math.max(
                    ...allLosses.map(
                        loss =>
                            loss.points
                    )
                )
                : 0;


        const highestLosingScores =
            allLosses.filter(
                loss =>
                    nearlyEqual(
                        loss.points,
                        highestLosingScoreValue
                    )
            );


        /*
         * =====================================================
         * BIGGEST BLOWOUT WIN
         * =====================================================
         */

        const biggestBlowoutValue =
            allWins.length
                ? Math.max(
                    ...allWins.map(
                        win =>
                            win.margin
                    )
                )
                : 0;


        const biggestBlowoutWins =
            allWins.filter(
                win =>
                    nearlyEqual(
                        win.margin,
                        biggestBlowoutValue
                    )
            );


        /*
         * =====================================================
         * CLOSEST LOSS
         * =====================================================
         */

        const closestLossValue =
            allLosses.length
                ? Math.min(
                    ...allLosses.map(
                        loss =>
                            loss.margin
                    )
                )
                : 0;


        const closestLosses =
            allLosses.filter(
                loss =>
                    nearlyEqual(
                        loss.margin,
                        closestLossValue
                    )
            );


        /*
         * =====================================================
         * REGULAR-SEASON STANDINGS
         * =====================================================
         */

        const standings =
            [
                ...seasonData.teams
            ]
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
 * FINAL STANDINGS
 * =====================================================
 *
 * Places 1–6:
 * Actual championship playoff finish.
 *
 * Places 7–12:
 * Regular-season standings among non-playoff teams.
 *
 * The Toilet Bowl / consolation bracket is NOT used.
 */

const playoffFinishers =
    [
        champion,
        runnerUp,
        thirdPlace,
        fourthPlace,
        fifthPlace,
        sixthPlace
    ]
        .filter(
            Boolean
        );


const playoffRosterIds =
    new Set(
        playoffFinishers.map(
            team =>
                Number(
                    team.roster_id
                )
        )
    );


const nonPlayoffTeams =
    seasonData.teams
        .filter(
            team =>
                !playoffRosterIds.has(
                    Number(
                        team.roster_id
                    )
                )
        )
        .sort(
            (a, b) => {

                if (
                    Number(b.wins || 0) !==
                    Number(a.wins || 0)
                ) {

                    return (
                        Number(b.wins || 0) -
                        Number(a.wins || 0)
                    );

                }


                if (
                    Number(a.losses || 0) !==
                    Number(b.losses || 0)
                ) {

                    return (
                        Number(a.losses || 0) -
                        Number(b.losses || 0)
                    );

                }


                return (
                    Number(b.points_for || 0) -
                    Number(a.points_for || 0)
                );

            }
        );


const finalStandings =
    [
        ...playoffFinishers,
        ...nonPlayoffTeams
    ];

        /*
         * =====================================================
         * BUILD SEASON PAGE
         * =====================================================
         */

        historySeasonContent.innerHTML = `

            <div class="history-season-header">

                <span>
                    ${season} Season
                </span>

                <h2>
                    ${
                        confirmedChampions[
                            season
                        ]?.team_name ||
                        'Season Archive'
                    }
                </h2>

                <p>
                    League Champion — ${championOwnerName}
                </p>

            </div>


            <div class="history-podium">

                <div
                    class="
                        history-podium-card
                        history-podium-champion
                    "
                >

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
                                : confirmedChampions[
                                    season
                                  ]?.team_name ||
                                  '—'
                        }
                    </strong>

                    <small>
                        ${championOwnerName}
                    </small>

                </div>


                <div
                    class="
                        history-podium-card
                        history-podium-runnerup
                    "
                >

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
                        ${runnerUpOwnerName}
                    </small>

                </div>


                <div
                    class="
                        history-podium-card
                        history-podium-third
                    "
                >

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
                        ${thirdPlaceOwnerName}
                    </small>

                </div>

            </div>


            <!-- ==========================================
                 SEASON LEADERS
            =========================================== -->

            <h3 class="history-subtitle">
                Season Leaders
            </h3>


            <div
                class="
                    history-leaders-grid
                    history-awards-grid
                "
            >


                ${leaderCard(
                    'Most Wins',
                    mostWinsValue,
                    formatManagerNames(
                        mostWinsManagers
                    )
                )}


                ${leaderCard(
                    'Highest PPG',
                    formatNumber(
                        highestPPGValue
                    ),
                    formatManagerNames(
                        highestPPGManagers
                    )
                )}


                ${leaderCard(
                    'Highest Single-Game Score',
                    formatNumber(
                        highestSingleGameValue
                    ),
                    formatGameAwardDetails(
                        highestSingleGames
                    )
                )}


                ${leaderCard(
                    'Most Points For',
                    formatNumber(
                        mostPointsForValue
                    ),
                    formatTeamManagerNames(
                        mostPointsForTeams
                    )
                )}


                ${leaderCard(
                    'Most Efficient Manager',
                    efficiencyData.length
                        ? `${formatNumber(
                            highestEfficiencyValue
                          )}%`
                        : '—',
                    formatEfficiencyNames(
                        mostEfficientManagers
                    )
                )}


                ${leaderCard(
                    'Longest Winning Streak',
                    longestWinningStreakValue
                        ? `${longestWinningStreakValue} Games`
                        : '—',
                    longestWinningStreakValue
                        ? formatManagerNames(
                            longestWinningStreakManagers
                          )
                        : '—'
                )}


                ${leaderCard(
                    'Lowest Score in a Win',
                    allWins.length
                        ? formatNumber(
                            lowestWinningScoreValue
                          )
                        : '—',
                    formatWinLossDetails(
                        lowestWinningScores
                    )
                )}


                ${leaderCard(
                    'Biggest Blowout Win',
                    allWins.length
                        ? `${formatNumber(
                            biggestBlowoutValue
                          )} pts`
                        : '—',
                    formatWinLossDetails(
                        biggestBlowoutWins
                    )
                )}


            </div>


            <!-- ==========================================
                 SEASON LOSERS
            =========================================== -->

            <h3
                class="
                    history-subtitle
                    history-losers-title
                "
            >
                Season Losers
            </h3>


            <div
                class="
                    history-leaders-grid
                    history-awards-grid
                    history-losers-grid
                "
            >


                ${leaderCard(
                    'Fewest Wins',
                    fewestWinsValue,
                    formatManagerNames(
                        fewestWinsManagers
                    )
                )}


                ${leaderCard(
                    'Lowest PPG',
                    formatNumber(
                        lowestPPGValue
                    ),
                    formatManagerNames(
                        lowestPPGManagers
                    )
                )}


                ${leaderCard(
                    'Lowest Single-Game Score',
                    allScores.length
                        ? formatNumber(
                            lowestSingleGameValue
                          )
                        : '—',
                    formatGameAwardDetails(
                        lowestSingleGames
                    )
                )}


                ${leaderCard(
                    'Fewest Points For',
                    formatNumber(
                        fewestPointsForValue
                    ),
                    formatTeamManagerNames(
                        fewestPointsForTeams
                    )
                )}


                ${leaderCard(
                    'Least Efficient Manager',
                    efficiencyData.length
                        ? `${formatNumber(
                            lowestEfficiencyValue
                          )}%`
                        : '—',
                    formatEfficiencyNames(
                        leastEfficientManagers
                    )
                )}


                ${leaderCard(
                    'Longest Losing Streak',
                    longestLosingStreakValue
                        ? `${longestLosingStreakValue} Games`
                        : '—',
                    longestLosingStreakValue
                        ? formatManagerNames(
                            longestLosingStreakManagers
                          )
                        : '—'
                )}


                ${leaderCard(
                    'Highest Score in a Loss',
                    allLosses.length
                        ? formatNumber(
                            highestLosingScoreValue
                          )
                        : '—',
                    formatWinLossDetails(
                        highestLosingScores
                    )
                )}


                ${leaderCard(
                    'Closest Loss',
                    allLosses.length
                        ? `${formatNumber(
                            closestLossValue
                          )} pts`
                        : '—',
                    formatWinLossDetails(
                        closestLosses
                    )
                )}


            </div>


                        <!-- ==========================================
                 REGULAR-SEASON STANDINGS
            =========================================== -->

            <h3 class="history-subtitle">
                Regular-Season Standings
            </h3>


            <div class="records-table-card">

                <div class="records-table-scroll">

                    <table class="history-standings-table">

                        <thead>

                            <tr>

                                <th>
                                    Rank
                                </th>

                                <th>
                                    Team
                                </th>

                                <th>
                                    Owner
                                </th>

                                <th>
                                    Record
                                </th>

                                <th>
                                    PF
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            ${standings
                                .map(
                                    (
                                        team,
                                        index
                                    ) => `

                                        <tr>

                                            <td>
                                                ${index + 1}
                                            </td>

                                            <td class="history-team-name">
                                                ${team.team_name}
                                            </td>

                                            <td>

                                                ${getLeagueOwnerName(
                                                    team.owner_id,
                                                    team.owner
                                                )}

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
                                                    team.points_for ||
                                                    0
                                                ).toFixed(2)}

                                            </td>

                                        </tr>

                                    `
                                )
                                .join('')}

                        </tbody>

                    </table>

                </div>

            </div>

<!-- ==========================================
     FINAL STANDINGS
=========================================== -->

<h3 class="history-subtitle">
    Final Standings
</h3>

<div class="history-final-standings-note">

    Final positions 1–6 reflect playoff results.
    Positions 7–12 are ranked by regular-season record,
    with Points For as the tiebreaker.
    Toilet Bowl results do not affect final standings.

</div>

<div class="records-table-card">

    <div class="records-table-scroll">

        <table class="history-standings-table">

            <thead>

                <tr>

                    <th>
                        Rank
                    </th>

                    <th>
                        Team
                    </th>

                    <th>
                        Owner
                    </th>

                    <th>
                        Record
                    </th>

                    <th>
                        PF
                    </th>

                </tr>

            </thead>


            <tbody>

                ${finalStandings
                    .map(
                        (
                            team,
                            index
                        ) => `

<tr
    class="${
        index < 6
            ? 'history-final-playoff'
            : 'history-final-nonplayoff'
    }"
>

<td class="history-final-rank">

    ${
        index === 0
            ? '🏆 '
            : index === 1
                ? '🥈 '
                : index === 2
                    ? '🥉 '
                    : ''
    }

    ${index + 1}

</td>

                                <td class="history-team-name">
                                    ${team.team_name}
                                </td>

                                <td>

                                    ${getLeagueOwnerName(
                                        team.owner_id,
                                        team.owner
                                    )}

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
                                        team.points_for ||
                                        0
                                    ).toFixed(2)}

                                </td>

                            </tr>

                        `
                    )
                    .join('')}

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
 * LEADER / LOSER CARD
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
 * FORMAT MANAGER NAMES
 * ======================================================
 *
 * Works with manager-performance objects as well as
 * the custom game-stat objects created above.
 *
 * Supports any number of ties.
 */

function formatManagerNames(
    managers
) {

    if (
        !managers ||
        managers.length === 0
    ) {

        return '—';

    }


    return managers
        .map(
            manager =>

                getLeagueOwnerName(
                    manager.owner_id,
                    manager.owner ||
                    'Unknown Manager'
                )

        )
        .join(
            ' • '
        );

}



/*
 * ======================================================
 * FORMAT TEAM / MANAGER NAMES
 * ======================================================
 */

function formatTeamManagerNames(
    teams
) {

    if (
        !teams ||
        teams.length === 0
    ) {

        return '—';

    }


    return teams
        .map(
            team => {

                const ownerName =
                    getLeagueOwnerName(
                        team.owner_id,
                        team.owner ||
                        'Unknown Manager'
                    );


                return `${ownerName} • ${team.team_name}`;

            }
        )
        .join(
            '<br>'
        );

}



/*
 * ======================================================
 * FORMAT EFFICIENCY NAMES
 * ======================================================
 */

function formatEfficiencyNames(
    managers
) {

    if (
        !managers ||
        managers.length === 0
    ) {

        return '—';

    }


    return managers
        .map(
            manager => {

                const ownerName =
                    getLeagueOwnerName(
                        manager.owner_id,
                        manager.owner ||
                        'Unknown Manager'
                    );


                return `
                    ${ownerName}
                    •
                    ${formatNumber(
                        manager.actual_pf
                    )}
                    /
                    ${formatNumber(
                        manager.max_pf
                    )}
                    Max PF
                `;

            }
        )
        .join(
            '<br>'
        );

}



/*
 * ======================================================
 * FORMAT SINGLE-GAME AWARD DETAILS
 * ======================================================
 *
 * Used for highest/lowest single-game score.
 */

function formatGameAwardDetails(
    games
) {

    if (
        !games ||
        games.length === 0
    ) {

        return '—';

    }


    return games
        .map(
            game => {

                const ownerName =
                    getLeagueOwnerName(
                        game.owner_id,
                        game.owner ||
                        'Unknown Manager'
                    );


                const opponentName =
                    getLeagueOwnerName(
                        game.opponent_owner_id,
                        game.opponent ||
                        'Unknown Manager'
                    );


                return `

                    ${ownerName}
                    • Week ${game.week}
                    • vs ${opponentName}
                    • ${formatNumber(
                        game.points
                    )}-${formatNumber(
                        game.opponent_points
                    )}

                `;

            }
        )
        .join(
            '<br>'
        );

}



/*
 * ======================================================
 * FORMAT WIN / LOSS DETAILS
 * ======================================================
 *
 * Used for:
 *
 * Lowest Score in a Win
 * Biggest Blowout Win
 * Highest Score in a Loss
 * Closest Loss
 */

function formatWinLossDetails(
    games
) {

    if (
        !games ||
        games.length === 0
    ) {

        return '—';

    }


    return games
        .map(
            game => {

                const ownerName =
                    getLeagueOwnerName(
                        game.owner_id,
                        game.owner ||
                        'Unknown Manager'
                    );


                const opponentName =
                    getLeagueOwnerName(
                        game.opponent_owner_id,
                        game.opponent ||
                        'Unknown Manager'
                    );


                return `

                    ${ownerName}
                    • Week ${game.week}
                    • vs ${opponentName}
                    • ${formatNumber(
                        game.points
                    )}-${formatNumber(
                        game.opponent_points
                    )}

                `;

            }
        )
        .join(
            '<br>'
        );

}



/*
 * ======================================================
 * LONGEST STREAK
 * ======================================================
 *
 * Ties break a winning or losing streak.
 */

function longestStreak(
    weeklyResults,
    targetResult
) {

    let longest =
        0;


    let current =
        0;


    weeklyResults.forEach(
        week => {

            if (
                week.result ===
                targetResult
            ) {

                current++;


                longest =
                    Math.max(
                        longest,
                        current
                    );

            }

            else {

                current =
                    0;

            }

        }
    );


    return longest;

}



/*
 * ======================================================
 * SLEEPER POINTS
 * ======================================================
 *
 * Sleeper stores fantasy points like:
 *
 * fpts: 4179
 * fpts_decimal: 73
 *
 * Meaning:
 *
 * 4179.73
 *
 * The same applies to ppts / ppts_decimal.
 */

function sleeperPoints(
    wholePoints,
    decimalPoints
) {

    const whole =
        Number(
            wholePoints ||
            0
        );


    const decimal =
        Number(
            decimalPoints ||
            0
        );


    return roundTo(
        whole +
        (
            decimal /
            100
        ),
        2
    );

}



/*
 * ======================================================
 * NUMBER FORMAT
 * ======================================================
 */

function formatNumber(
    value
) {

    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return '—';

    }


    return number.toFixed(
        2
    );

}



/*
 * ======================================================
 * ROUND NUMBER
 * ======================================================
 */

function roundTo(
    value,
    decimals = 2
) {

    const factor =
        Math.pow(
            10,
            decimals
        );


    return Math.round(
        (
            Number(
                value
            ) +
            Number.EPSILON
        ) *
        factor
    ) /
    factor;

}



/*
 * ======================================================
 * FLOAT COMPARISON
 * ======================================================
 *
 * Prevent tiny floating-point differences from breaking
 * ties such as 81.75 vs 81.7500000001.
 */

function nearlyEqual(
    first,
    second,
    tolerance = 0.001
) {

    return (
        Math.abs(
            Number(first) -
            Number(second)
        ) <=
        tolerance
    );

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
 * SEASON SELECTOR
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
 * In this league's consolation bracket:
 *
 * - Winning earns the better finishing position.
 * - Losing moves a team toward the Toilet Bowl.
 * - The worst two regular-season teams receive byes.
 *
 * Sleeper's loser-bracket w/l progression is inverted
 * relative to how the actual Toilet Bowl result should
 * be interpreted for our Hall of Shame.
 *
 * For the final-round p === 1 game:
 *
 * .l = actual game winner / 11th place
 * .w = actual game loser  / 12th place
 *
 * Hall of Shame therefore uses .w.
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


        const shameResults =
            [];


        /*
         * Process each historical season separately.
         */

        for (
            const [
                yearText,
                leagueId
            ]
            of Object.entries(
                leagueIds
            )
        ) {

            const season =
                Number(
                    yearText
                );


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

            const userMap =
                {};


            users.forEach(
                user => {

                    userMap[
                        user.user_id
                    ] =
                        user;

                }
            );


            /*
             * =============================================
             * ROSTER LOOKUP
             * =============================================
             */

            const rosterMap =
                {};


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

                        sleeper_username:
                            user
                                ?.display_name ||
                            "Unknown Manager",

                        team_name:
                            user
                                ?.metadata
                                ?.team_name
                                ?.trim() ||
                            user
                                ?.display_name ||
                            `Team ${roster.roster_id}`

                    };

                }
            );


            /*
             * =============================================
             * FIND FINAL ROUND
             * =============================================
             */

            const finalRound =
                Math.max(
                    ...bracket.map(
                        game =>
                            game.r ||
                            0
                    )
                );


            /*
             * =============================================
             * TOILET BOWL FINAL
             * =============================================
             */

            const toiletBowlFinal =
                bracket.find(
                    game =>
                        game.r ===
                            finalRound &&
                        game.p ===
                            1
                );


            if (
                !toiletBowlFinal ||
                toiletBowlFinal.w ==
                    null
            ) {

                continue;

            }


            /*
             * We confirmed through historical results
             * that .w identifies the actual 12th-place
             * finisher in this league's losers bracket.
             */

            const lastPlaceRosterId =
                Number(
                    toiletBowlFinal.w
                );


            const lastPlaceTeam =
                rosterMap[
                    lastPlaceRosterId
                ];


            if (
                !lastPlaceTeam
            ) {

                console.warn(
                    `Unable to find ${season} last-place roster:`,
                    lastPlaceRosterId
                );

                continue;

            }


            /*
             * Real owner name comes from league-data.js.
             */

            const realOwnerName =
                getLeagueOwnerName(
                    lastPlaceTeam.owner_id,
                    lastPlaceTeam
                        .sleeper_username
                );


            shameResults.push(
                {

                    season:
                        season,

                    roster_id:
                        lastPlaceRosterId,

                    owner_id:
                        lastPlaceTeam.owner_id,

                    owner:
                        realOwnerName,

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

                        </div>

                    `
                )
                .join('');


    } catch (
        error
    ) {

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
