export async function onRequestGet(context) {

    /*
     * Each Sleeper season has its own league ID.
     *
     * Keeping this map here allows us to request
     * one season at a time without walking through
     * every historical league during one Worker call.
     */

    const leagueIds = {
        2023: "978545340355862528",
        2024: "1050836306860957696",
        2025: "1181097603123351552",
        2026: "1312098239821914112"
    };


    try {

        /*
         * Read the requested season from the URL.
         *
         * Example:
         * /api/matchup-history?season=2025
         */

        const url =
            new URL(context.request.url);


        const requestedSeason =
            Number(
                url.searchParams.get("season")
            );


        /*
         * Make sure the requested year exists.
         */

        if (!leagueIds[requestedSeason]) {

            return new Response(

                JSON.stringify(
                    {
                        error:
                            "Please provide a valid season.",

                        available_seasons:
                            Object.keys(leagueIds)
                    },
                    null,
                    2
                ),

                {
                    status: 400,

                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }

            );

        }


        const leagueId =
            leagueIds[requestedSeason];


        /*
         * Get league information.
         */

        const leagueResponse =
            await fetch(
                `https://api.sleeper.app/v1/league/${leagueId}`
            );


        if (!leagueResponse.ok) {

            throw new Error(
                "Unable to retrieve league information."
            );

        }


        const league =
            await leagueResponse.json();


        /*
         * Retrieve users.
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
         * Retrieve rosters.
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
         * Build user lookup.
         */

        const userMap = {};


        users.forEach(user => {

            userMap[user.user_id] =
                user;

        });


        /*
         * Build roster lookup.
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
         * Sleeper stores the playoff start week
         * independently for each season.
         *
         * This correctly handles:
         *
         * 2023 -> Week 16
         * 2024+ -> Week 15
         */

        const playoffStart =
            league.settings
                ?.playoff_week_start || 15;


        const games = [];


        /*
         * Retrieve the season one week at a time.
         *
         * A single season stays well below the
         * Worker subrequest limit.
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
             * Group entries by matchup ID.
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
             * Convert each two-team group
             * into one game.
             */

            Object.entries(
                matchupGroups
            ).forEach(
                ([matchupId, entries]) => {

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


                    let winnerOwnerId =
                        null;

                    let loserOwnerId =
                        null;

                    let tie =
                        false;


                    if (
                        firstPoints >
                        secondPoints
                    ) {

                        winnerOwnerId =
                            firstTeam.owner_id;

                        loserOwnerId =
                            secondTeam.owner_id;

                    }

                    else if (
                        secondPoints >
                        firstPoints
                    ) {

                        winnerOwnerId =
                            secondTeam.owner_id;

                        loserOwnerId =
                            firstTeam.owner_id;

                    }

                    else {

                        tie = true;

                    }


                    games.push({

                        season:
                            requestedSeason,

                        week:
                            week,

                        matchup_id:
                            Number(
                                matchupId
                            ),

                        playoff:
                            week >=
                            playoffStart,

                        team_1: {

                            roster_id:
                                firstTeam.roster_id,

                            owner_id:
                                firstTeam.owner_id,

                            owner:
                                firstTeam.owner,

                            team_name:
                                firstTeam.team_name,

                            points:
                                firstPoints

                        },

                        team_2: {

                            roster_id:
                                secondTeam.roster_id,

                            owner_id:
                                secondTeam.owner_id,

                            owner:
                                secondTeam.owner,

                            team_name:
                                secondTeam.team_name,

                            points:
                                secondPoints

                        },

                        winner_owner_id:
                            winnerOwnerId,

                        loser_owner_id:
                            loserOwnerId,

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
         * Return one season.
         */

        return new Response(

            JSON.stringify(
                {

                    season:
                        requestedSeason,

                    league_id:
                        leagueId,

                    playoff_start_week:
                        playoffStart,

                    games_found:
                        games.length,

                    games:
                        games

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
