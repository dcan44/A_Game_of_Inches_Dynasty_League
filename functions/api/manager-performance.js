export async function onRequestGet() {

    const leagueIds = {
        2023: "978545340355862528",
        2024: "1050836306860957696",
        2025: "1181097603123351552",
        2026: "1312098239821914112"
    };


    try {

        const managerMap = {};

        /*
         * Process each season independently so we stay
         * comfortably below Cloudflare request limits.
         */

        for (const [seasonText, leagueId] of Object.entries(leagueIds)) {

            const season = Number(seasonText);


            /*
             * League information
             */

            const leagueResponse = await fetch(
                `https://api.sleeper.app/v1/league/${leagueId}`
            );

            if (!leagueResponse.ok) {
                continue;
            }

            const league = await leagueResponse.json();


            /*
             * Users
             */

            const usersResponse = await fetch(
                `https://api.sleeper.app/v1/league/${leagueId}/users`
            );

            const users = usersResponse.ok
                ? await usersResponse.json()
                : [];


            /*
             * Rosters
             */

            const rostersResponse = await fetch(
                `https://api.sleeper.app/v1/league/${leagueId}/rosters`
            );

            const rosters = rostersResponse.ok
                ? await rostersResponse.json()
                : [];


            /*
             * Championship playoff bracket
             */

            const bracketResponse = await fetch(
                `https://api.sleeper.app/v1/league/${leagueId}/winners_bracket`
            );

            const winnersBracket = bracketResponse.ok
                ? await bracketResponse.json()
                : [];


            const userMap = {};

            users.forEach(user => {
                userMap[user.user_id] = user;
            });


            const rosterMap = {};

            rosters.forEach(roster => {

                const user = userMap[roster.owner_id];

                rosterMap[roster.roster_id] = {

                    roster_id: roster.roster_id,

                    owner_id: roster.owner_id,

                    owner:
                        user?.display_name ||
                        "Unknown Owner",

                    team_name:
                        user?.metadata?.team_name?.trim() ||
                        user?.display_name ||
                        `Team ${roster.roster_id}`

                };

            });


            /*
             * Determine which roster IDs actually made
             * the championship playoff bracket.
             *
             * We collect every roster explicitly appearing
             * as t1 / t2 / winner / loser in the winners bracket.
             */

            const playoffRosterIds = new Set();


            winnersBracket.forEach(game => {

                [
                    game.t1,
                    game.t2,
                    game.w,
                    game.l
                ].forEach(value => {

                    if (
                        typeof value === "number"
                    ) {

                        playoffRosterIds.add(value);

                    }

                });

            });


            /*
             * Determine playoff start week directly
             * from that year's Sleeper settings.
             */

            const playoffStartWeek =
                league.settings?.playoff_week_start || 15;


            /*
             * Track which playoff weeks each roster actually
             * participated in.
             *
             * We use the winners bracket winners/losers to
             * confirm participation rather than counting every
             * post-season matchup Sleeper happens to return.
             */

            const playoffGamesByRoster = {};


            winnersBracket.forEach(bracketGame => {

                const rosterIds = new Set();


                [
                    bracketGame.t1,
                    bracketGame.t2,
                    bracketGame.w,
                    bracketGame.l
                ].forEach(value => {

                    if (
                        typeof value === "number"
                    ) {

                        rosterIds.add(value);

                    }

                });


                rosterIds.forEach(rosterId => {

                    if (!playoffGamesByRoster[rosterId]) {

                        playoffGamesByRoster[rosterId] =
                            new Set();

                    }

                });

            });


            /*
             * Process weekly matchups.
             */

            for (
                let week = 1;
                week <= 18;
                week++
            ) {

                const matchupResponse =
                    await fetch(
                        `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`
                    );


                if (!matchupResponse.ok) {
                    continue;
                }


                const matchups =
                    await matchupResponse.json();


                if (
                    !Array.isArray(matchups) ||
                    matchups.length === 0
                ) {
                    continue;
                }


                /*
                 * Group teams into actual games.
                 */

                const matchupGroups = {};


                matchups.forEach(entry => {

                    if (
                        entry.matchup_id === null ||
                        entry.matchup_id === undefined
                    ) {
                        return;
                    }


                    if (!matchupGroups[entry.matchup_id]) {

                        matchupGroups[entry.matchup_id] = [];

                    }


                    matchupGroups[entry.matchup_id]
                        .push(entry);

                });


                Object.values(matchupGroups)
                    .forEach(entries => {

                        if (entries.length !== 2) {
                            return;
                        }


                        const first = entries[0];
                        const second = entries[1];


                        const firstTeam =
                            rosterMap[first.roster_id];

                        const secondTeam =
                            rosterMap[second.roster_id];


                        if (!firstTeam || !secondTeam) {
                            return;
                        }


                        const firstPoints =
                            Number(first.points || 0);

                        const secondPoints =
                            Number(second.points || 0);


                        /*
                         * Ignore completely empty future games.
                         */

                        if (
                            firstPoints === 0 &&
                            secondPoints === 0 &&
                            league.status !== "complete"
                        ) {
                            return;
                        }


                        const isPostseason =
                            week >= playoffStartWeek;


                        /*
                         * Regular season:
                         * everything before playoff_start_week.
                         */

                        if (!isPostseason) {

                            recordGame(
                                firstTeam,
                                secondTeam,
                                firstPoints,
                                secondPoints,
                                season,
                                week,
                                false,
                                managerMap
                            );

                            return;

                        }


                        /*
                         * Postseason:
                         *
                         * Only count games where BOTH managers
                         * are championship-playoff teams.
                         *
                         * This excludes consolation teams.
                         */

                        const firstInPlayoffs =
                            playoffRosterIds.has(
                                first.roster_id
                            );

                        const secondInPlayoffs =
                            playoffRosterIds.has(
                                second.roster_id
                            );


                        if (
                            !firstInPlayoffs ||
                            !secondInPlayoffs
                        ) {
                            return;
                        }


                        /*
                         * Bye-week protection:
                         *
                         * Sleeper may return odd postseason
                         * structures. A legitimate counted game
                         * must contain two playoff teams.
                         */

                        recordGame(
                            firstTeam,
                            secondTeam,
                            firstPoints,
                            secondPoints,
                            season,
                            week,
                            true,
                            managerMap
                        );

                    });

            }

        }


        /*
         * Convert managerMap into final statistics.
         */

        const managers =
            Object.values(managerMap)
                .map(manager => {

                    const regularGames =
                        manager.regular_wins +
                        manager.regular_losses +
                        manager.regular_ties;


                    const playoffGames =
                        manager.playoff_wins +
                        manager.playoff_losses +
                        manager.playoff_ties;


                    const overallGames =
                        regularGames +
                        playoffGames;


                    const winPercentage =
                        regularGames > 0
                            ? (
                                manager.regular_wins +
                                manager.regular_ties * 0.5
                            ) / regularGames
                            : 0;


                    return {

                        owner_id:
                            manager.owner_id,

                        owner:
                            manager.owner,

                        seasons:
                            Array.from(
                                manager.seasons
                            ).sort(
                                (a, b) => a - b
                            ),

                        seasons_played:
                            manager.seasons.size,


                        regular_season: {

                            wins:
                                manager.regular_wins,

                            losses:
                                manager.regular_losses,

                            ties:
                                manager.regular_ties,

                            games:
                                regularGames,

                            win_percentage:
                                Number(
                                    winPercentage.toFixed(4)
                                )

                        },


                        playoffs: {

                            wins:
                                manager.playoff_wins,

                            losses:
                                manager.playoff_losses,

                            ties:
                                manager.playoff_ties,

                            games:
                                playoffGames

                        },


                        overall: {

                            wins:
                                manager.regular_wins +
                                manager.playoff_wins,

                            losses:
                                manager.regular_losses +
                                manager.playoff_losses,

                            ties:
                                manager.regular_ties +
                                manager.playoff_ties,

                            games:
                                overallGames

                        },


                        scoring: {

                            points_for:
                                Number(
                                    manager.points_for
                                        .toFixed(2)
                                ),

                            points_against:
                                Number(
                                    manager.points_against
                                        .toFixed(2)
                                ),

                            points_per_game:
                                regularGames > 0
                                    ? Number(
                                        (
                                            manager.points_for /
                                            regularGames
                                        ).toFixed(2)
                                    )
                                    : 0,

                            points_allowed_per_game:
                                regularGames > 0
                                    ? Number(
                                        (
                                            manager.points_against /
                                            regularGames
                                        ).toFixed(2)
                                    )
                                    : 0

                        },


                        highest_team_score:
                            manager.highest_team_score,


                        lowest_team_score:
                            manager.lowest_team_score,


                        biggest_win:
                            manager.biggest_win,


                        biggest_loss:
                            manager.biggest_loss,


                        highest_score_in_loss:
                            manager.highest_score_in_loss

                    };

                });


        managers.sort(
            (a, b) =>
                b.regular_season.win_percentage -
                a.regular_season.win_percentage
        );


        return new Response(

            JSON.stringify(
                {
                    managers_found:
                        managers.length,

                    managers:
                        managers
                },
                null,
                2
            ),

            {
                headers: {
                    "Content-Type":
                        "application/json"
                }
            }

        );


    } catch (error) {

        return new Response(

            JSON.stringify(
                {
                    error:
                        error.message
                },
                null,
                2
            ),

            {
                status: 500,

                headers: {
                    "Content-Type":
                        "application/json"
                }
            }

        );

    }

}



/*
 * ======================================================
 * RECORD ONE GAME
 * ======================================================
 */

function recordGame(
    firstTeam,
    secondTeam,
    firstPoints,
    secondPoints,
    season,
    week,
    playoff,
    managerMap
) {

    const first =
        getManager(
            firstTeam,
            managerMap
        );


    const second =
        getManager(
            secondTeam,
            managerMap
        );


    first.seasons.add(season);
    second.seasons.add(season);


    /*
     * We only use REGULAR-SEASON games for PPG/PAPG
     * and regular scoring records.
     */

    if (!playoff) {

        first.points_for +=
            firstPoints;

        first.points_against +=
            secondPoints;


        second.points_for +=
            secondPoints;

        second.points_against +=
            firstPoints;


        updateScoringRecords(
            first,
            firstTeam,
            firstPoints,
            secondPoints,
            season,
            week
        );


        updateScoringRecords(
            second,
            secondTeam,
            secondPoints,
            firstPoints,
            season,
            week
        );

    }


    /*
     * Win / loss / tie
     */

    if (firstPoints > secondPoints) {

        if (playoff) {

            first.playoff_wins++;
            second.playoff_losses++;

        } else {

            first.regular_wins++;
            second.regular_losses++;

        }

    }

    else if (secondPoints > firstPoints) {

        if (playoff) {

            second.playoff_wins++;
            first.playoff_losses++;

        } else {

            second.regular_wins++;
            first.regular_losses++;

        }

    }

    else {

        if (playoff) {

            first.playoff_ties++;
            second.playoff_ties++;

        } else {

            first.regular_ties++;
            second.regular_ties++;

        }

    }

}



/*
 * ======================================================
 * CREATE / GET MANAGER
 * ======================================================
 */

function getManager(
    team,
    managerMap
) {

    if (!managerMap[team.owner_id]) {

        managerMap[team.owner_id] = {

            owner_id:
                team.owner_id,

            owner:
                team.owner,

            seasons:
                new Set(),

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

            highest_team_score:
                null,

            lowest_team_score:
                null,

            biggest_win:
                null,

            biggest_loss:
                null,

            highest_score_in_loss:
                null

        };

    }


    return managerMap[
        team.owner_id
    ];

}



/*
 * ======================================================
 * SCORING RECORDS
 * ======================================================
 */

function updateScoringRecords(
    manager,
    team,
    points,
    opponentPoints,
    season,
    week
) {

    /*
     * Highest team score
     */

    if (
        !manager.highest_team_score ||
        points >
        manager.highest_team_score.points
    ) {

        manager.highest_team_score = {

            points:
                Number(
                    points.toFixed(2)
                ),

            season:
                season,

            week:
                week,

            team_name:
                team.team_name

        };

    }


    /*
     * Lowest team score
     */

    if (
        !manager.lowest_team_score ||
        points <
        manager.lowest_team_score.points
    ) {

        manager.lowest_team_score = {

            points:
                Number(
                    points.toFixed(2)
                ),

            season:
                season,

            week:
                week,

            team_name:
                team.team_name

        };

    }


    const margin =
        Number(
            Math.abs(
                points -
                opponentPoints
            ).toFixed(2)
        );


    /*
     * Biggest win
     */

    if (points > opponentPoints) {

        if (
            !manager.biggest_win ||
            margin >
            manager.biggest_win.margin
        ) {

            manager.biggest_win = {

                margin:
                    margin,

                score:
                    Number(
                        points.toFixed(2)
                    ),

                opponent_score:
                    Number(
                        opponentPoints.toFixed(2)
                    ),

                season:
                    season,

                week:
                    week

            };

        }

    }


    /*
     * Biggest loss
     */

    if (points < opponentPoints) {

        if (
            !manager.biggest_loss ||
            margin >
            manager.biggest_loss.margin
        ) {

            manager.biggest_loss = {

                margin:
                    margin,

                score:
                    Number(
                        points.toFixed(2)
                    ),

                opponent_score:
                    Number(
                        opponentPoints.toFixed(2)
                    ),

                season:
                    season,

                week:
                    week

            };

        }


        /*
         * Highest score in a loss
         */

        if (
            !manager.highest_score_in_loss ||
            points >
            manager.highest_score_in_loss.points
        ) {

            manager.highest_score_in_loss = {

                points:
                    Number(
                        points.toFixed(2)
                    ),

                opponent_points:
                    Number(
                        opponentPoints.toFixed(2)
                    ),

                season:
                    season,

                week:
                    week

            };

        }

    }

}
