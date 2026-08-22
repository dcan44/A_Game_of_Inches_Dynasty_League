export async function onRequestGet(context) {

    /*
     * =====================================================
     * LEAGUE IDS BY SEASON
     * =====================================================
     */

    const leagueIds = {

        2023:
            "978545340355862528",

        2024:
            "1050836306860957696",

        2025:
            "1181097603123351552",

        2026:
            "1312098239821914112"

    };


    try {

        /*
         * =====================================================
         * REQUESTED SEASON
         * =====================================================
         */

        const url =
            new URL(
                context.request.url
            );


        const requestedSeason =
            Number(
                url.searchParams.get(
                    "season"
                )
            );


        if (
            !leagueIds[
                requestedSeason
            ]
        ) {

            return new Response(

                JSON.stringify(
                    {

                        error:
                            "Please provide a valid season.",

                        available_seasons:
                            Object.keys(
                                leagueIds
                            )

                    },
                    null,
                    2
                ),

                {

                    status:
                        400,

                    headers: {

                        "Content-Type":
                            "application/json"

                    }

                }

            );

        }


        const leagueId =
            leagueIds[
                requestedSeason
            ];


        /*
         * =====================================================
         * LEAGUE INFORMATION
         * =====================================================
         */

        const leagueResponse =
            await fetch(
                `https://api.sleeper.app/v1/league/${leagueId}`
            );


        if (
            !leagueResponse.ok
        ) {

            throw new Error(
                "Unable to retrieve league information."
            );

        }


        const league =
            await leagueResponse.json();


        /*
         * =====================================================
         * USERS
         * =====================================================
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
         * =====================================================
         * ROSTERS
         * =====================================================
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
         * =====================================================
         * CHAMPIONSHIP PLAYOFF BRACKET
         * =====================================================
         *
         * Sleeper's winners_bracket contains the actual
         * championship playoff bracket.
         *
         * We use this to distinguish real playoff games from
         * consolation and placement games.
         */

        const bracketResponse =
            await fetch(
                `https://api.sleeper.app/v1/league/${leagueId}/winners_bracket`
            );


        const winnersBracket =
            bracketResponse.ok
                ? await bracketResponse.json()
                : [];


        /*
         * =====================================================
         * USER LOOKUP
         * =====================================================
         */

        const userMap = {};


        users.forEach(
            user => {

                userMap[
                    user.user_id
                ] = user;

            }
        );


        /*
         * =====================================================
         * ROSTER LOOKUP
         * =====================================================
         */

        const rosterMap = {};


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

                    owner:
                        user?.display_name ||
                        "Unknown Owner",

                    team_name:
                        user
                            ?.metadata
                            ?.team_name
                            ?.trim() ||
                        user?.display_name ||
                        `Team ${roster.roster_id}`

                };

            }
        );


        /*
         * =====================================================
         * PLAYOFF START
         * =====================================================
         *
         * Confirmed league history:
         *
         * 2023 = Week 16
         * 2024+ = Week 15
         */

        const playoffStart =
            requestedSeason === 2023
                ? 16
                : 15;


        /*
         * =====================================================
         * CHAMPIONSHIP PLAYOFF GAME LOOKUP
         * =====================================================
         *
         * Each bracket round corresponds to a fantasy week:
         *
         * Round 1 = playoff start week
         * Round 2 = playoff start + 1
         * Round 3 = playoff start + 2
         *
         * Only bracket entries with two actual roster IDs
         * represent games. Bye weeks are ignored automatically.
         */

        const championshipPlayoffGames =
            new Set();


        winnersBracket.forEach(
            bracketGame => {

                if (
                    typeof bracketGame.t1 !==
                        "number" ||
                    typeof bracketGame.t2 !==
                        "number"
                ) {

                    return;

                }


                const bracketRound =
                    Number(
                        bracketGame.r || 1
                    );


                const gameWeek =
                    playoffStart +
                    bracketRound -
                    1;


                const rosterPair =
                    [
                        bracketGame.t1,
                        bracketGame.t2
                    ]
                        .sort(
                            (a, b) =>
                                a - b
                        )
                        .join("-");


                championshipPlayoffGames.add(
                    `${gameWeek}-${rosterPair}`
                );

            }
        );


        /*
         * =====================================================
         * MATCHUP RESULTS
         * =====================================================
         */

        const games = [];


        const lastWeek =
            18;


        for (
            let week = 1;
            week <= lastWeek;
            week++
        ) {

            const matchupResponse =
                await fetch(
                    `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`
                );


            if (
                !matchupResponse.ok
            ) {

                continue;

            }


            const matchups =
                await matchupResponse.json();


            if (
                !Array.isArray(
                    matchups
                ) ||
                matchups.length === 0
            ) {

                continue;

            }


            /*
             * =================================================
             * GROUP TEAMS BY MATCHUP ID
             * =================================================
             */

            const matchupGroups = {};


            matchups.forEach(
                entry => {

                    if (
                        entry.matchup_id ===
                            null ||
                        entry.matchup_id ===
                            undefined
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
                    ].push(
                        entry
                    );

                }
            );


            /*
             * =================================================
             * CREATE GAMES
             * =================================================
             */

            Object.entries(
                matchupGroups
            ).forEach(
                (
                    [
                        matchupId,
                        entries
                    ]
                ) => {

                    /*
                     * A real matchup requires exactly
                     * two teams.
                     */

                    if (
                        entries.length !==
                        2
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


                    /*
                     * Both teams need real owners.
                     */

                    if (
                        !firstTeam.owner_id ||
                        !secondTeam.owner_id
                    ) {

                        return;

                    }


                    /*
                     * Prevent impossible self-matchups.
                     */

                    if (
                        firstTeam.owner_id ===
                        secondTeam.owner_id
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


                    /*
                     * =================================================
                     * IGNORE EMPTY / FUTURE MATCHUPS
                     * =================================================
                     *
                     * Sleeper sometimes creates 0-0 matchup shells.
                     * These are not real games.
                     */

                    if (
                        firstPoints === 0 &&
                        secondPoints === 0
                    ) {

                        return;

                    }


                    /*
                     * =================================================
                     * IDENTIFY PLAYOFF TYPE
                     * =================================================
                     */

                    const isPostseason =
                        week >=
                        playoffStart;


                    const rosterPair =
                        [
                            first.roster_id,
                            second.roster_id
                        ]
                            .sort(
                                (a, b) =>
                                    a - b
                            )
                            .join("-");


                    const championshipPlayoff =
                        isPostseason &&
                        championshipPlayoffGames.has(
                            `${week}-${rosterPair}`
                        );


                    /*
                     * =================================================
                     * DETERMINE WINNER
                     * =================================================
                     */

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

                        tie =
                            true;

                    }


                    /*
                     * =================================================
                     * SAVE GAME
                     * =================================================
                     */

                    games.push(
                        {

                            season:
                                requestedSeason,

                            week:
                                week,

                            matchup_id:
                                Number(
                                    matchupId
                                ),

                            /*
                             * True for any postseason game.
                             */

                            playoff:
                                isPostseason,

                            /*
                             * True ONLY for a game in the
                             * championship winners bracket.
                             *
                             * Consolation games remain false.
                             */

                            championship_playoff:
                                championshipPlayoff,


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

                        }
                    );

                }
            );

        }


        /*
         * =====================================================
         * RETURN SEASON
         * =====================================================
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

                    championship_playoff_games_found:
                        games.filter(
                            game =>
                                game
                                    .championship_playoff
                        ).length,

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


    } catch (
        error
    ) {

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

                status:
                    500,

                headers: {

                    "Content-Type":
                        "application/json"

                }

            }

        );

    }

}
