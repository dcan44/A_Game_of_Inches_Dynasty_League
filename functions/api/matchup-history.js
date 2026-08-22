export async function onRequestGet() {

    const currentLeagueId =
        "1312098239821914112";

    try {

        const seasons = [];

        let leagueId =
            currentLeagueId;


        /*
         * Follow the Sleeper league chain backward.
         */

        for (
            let seasonIndex = 0;
            seasonIndex < 10 && leagueId;
            seasonIndex++
        ) {

            /*
             * Get league information.
             */

            const leagueResponse =
                await fetch(
                    `https://api.sleeper.app/v1/league/${leagueId}`
                );


            if (!leagueResponse.ok) {

                break;

            }


            const league =
                await leagueResponse.json();


            /*
             * Get users.
             */

            const usersResponse =
                await fetch(
                    `https://api.sleeper.app/v1/league/${leagueId}/users`
                );


            const users =
                usersResponse.ok
                    ? await usersResponse.json()
                    : [];


            /*
             * Get rosters.
             */

            const rostersResponse =
                await fetch(
                    `https://api.sleeper.app/v1/league/${leagueId}/rosters`
                );


            const rosters =
                rostersResponse.ok
                    ? await rostersResponse.json()
                    : [];


            /*
             * Create user lookup.
             */

            const userMap = {};


            users.forEach(user => {

                userMap[user.user_id] =
                    user;

            });


            /*
             * Create roster lookup.
             */

            const rosterMap = {};


            rosters.forEach(roster => {

                const user =
                    userMap[roster.owner_id];


                rosterMap[roster.roster_id] = {

                    roster_id:
                        roster.roster_id,

                    owner_id:
                        roster.owner_id,

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
             * Read the actual playoff start week
             * from each season.
             *
             * This automatically accounts for:
             *
             * 2023 = playoffs begin Week 16
             * Later seasons = playoffs begin Week 15
             */

            const playoffStart =
                league.settings
                    ?.playoff_week_start || 15;


            const games = [];


            /*
             * IMPORTANT:
             *
             * We retrieve each week ONE AT A TIME.
             *
             * The previous version attempted to open
             * many Sleeper connections simultaneously,
             * which caused Cloudflare's:
             *
             * "Response closed due to connection limit"
             *
             * error.
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


                /*
                 * Once we reach weeks with no matchup
                 * information, there is nothing to process.
                 */

                if (
                    !Array.isArray(matchups) ||
                    matchups.length === 0
                ) {

                    continue;

                }


                /*
                 * Group Sleeper roster entries by
                 * matchup_id.
                 */

                const matchupGroups = {};


                matchups.forEach(entry => {

                    if (
                        entry.matchup_id === null ||
                        entry.matchup_id === undefined
                    ) {

                        return;

                    }


                    if (
                        !matchupGroups[
                            entry.matchup_id
                        ]
                    ) {

                        matchupGroups[
                            entry.matchup_id
                        ] = [];

                    }


                    matchupGroups[
                        entry.matchup_id
                    ].push(entry);

                });


                /*
                 * Convert each pair into one game.
                 */

                Object.entries(
                    matchupGroups
                ).forEach(
                    ([matchupId, entries]) => {

                        /*
                         * A normal fantasy matchup
                         * should contain two teams.
                         */

                        if (
                            entries.length !== 2
                        ) {

                            return;

                        }


                        const first =
                            entries[0];

                        const second =
                            entries[1];


                        const firstTeam =
                            rosterMap[
                                first.roster_id
                            ];


                        const secondTeam =
                            rosterMap[
                                second.roster_id
                            ];


                        if (
                            !firstTeam ||
                            !secondTeam
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


                        let winnerRosterId =
                            null;

                        let loserRosterId =
                            null;

                        let tie =
                            false;


                        if (
                            firstPoints >
                            secondPoints
                        ) {

                            winnerRosterId =
                                first.roster_id;

                            loserRosterId =
                                second.roster_id;

                        }

                        else if (
                            secondPoints >
                            firstPoints
                        ) {

                            winnerRosterId =
                                second.roster_id;

                            loserRosterId =
                                first.roster_id;

                        }

                        else {

                            tie = true;

                        }


                        games.push({

                            season:
                                Number(
                                    league.season
                                ),

                            week:
                                week,

                            matchup_id:
                                Number(
                                    matchupId
                                ),

                            playoff:
                                week >=
                                playoffStart,

                            playoff_start_week:
                                playoffStart,


                            team_1: {

                                roster_id:
                                    firstTeam
                                        .roster_id,

                                owner_id:
                                    firstTeam
                                        .owner_id,

                                owner:
                                    firstTeam
                                        .owner,

                                team_name:
                                    firstTeam
                                        .team_name,

                                points:
                                    firstPoints

                            },


                            team_2: {

                                roster_id:
                                    secondTeam
                                        .roster_id,

                                owner_id:
                                    secondTeam
                                        .owner_id,

                                owner:
                                    secondTeam
                                        .owner,

                                team_name:
                                    secondTeam
                                        .team_name,

                                points:
                                    secondPoints

                            },


                            winner_roster_id:
                                winnerRosterId,

                            loser_roster_id:
                                loserRosterId,

                            tie:
                                tie,

                            margin:
                                Number(
                                    Math.abs(
                                        firstPoints -
                                        secondPoints
                                    ).toFixed(2)
                                )

                        });

                    }
                );

            }


            /*
             * Save this season.
             */

            seasons.push({

                season:
                    Number(
                        league.season
                    ),

                league_id:
                    league.league_id,

                playoff_start_week:
                    playoffStart,

                games_found:
                    games.length,

                games:
                    games

            });


            /*
             * Move backward one season.
             */

            leagueId =
                league.previous_league_id;

        }


        /*
         * Count all games across league history.
         */

        const totalGames =
            seasons.reduce(
                (total, season) =>
                    total +
                    season.games_found,
                0
            );


        /*
         * Return historical matchup information.
         */

        return new Response(

            JSON.stringify(
                {

                    seasons_found:
                        seasons.length,

                    total_games:
                        totalGames,

                    seasons:
                        seasons

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
