export async function onRequestGet() {

    const currentLeagueId = "1312098239821914112";

    try {

        const seasons = [];
        let leagueId = currentLeagueId;

        /*
         * Follow each Sleeper league backward through history.
         */

        for (let i = 0; i < 10 && leagueId; i++) {

            const leagueResponse = await fetch(
                `https://api.sleeper.app/v1/league/${leagueId}`
            );

            if (!leagueResponse.ok) {
                break;
            }

            const league = await leagueResponse.json();

            const [
                usersResponse,
                rostersResponse
            ] = await Promise.all([

                fetch(
                    `https://api.sleeper.app/v1/league/${leagueId}/users`
                ),

                fetch(
                    `https://api.sleeper.app/v1/league/${leagueId}/rosters`
                )

            ]);


            const users = usersResponse.ok
                ? await usersResponse.json()
                : [];

            const rosters = rostersResponse.ok
                ? await rostersResponse.json()
                : [];


            /*
             * Map Sleeper users.
             */

            const userMap = {};

            users.forEach(user => {

                userMap[user.user_id] = user;

            });


            /*
             * Map roster IDs to their owner for this particular season.
             *
             * This is important because franchises can change owners.
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
             * This automatically handles the change you mentioned:
             *
             * 2023 playoffs began Week 16.
             * Later seasons begin Week 15.
             *
             * We read each season's actual Sleeper setting instead
             * of hard-coding the week.
             */

            const playoffStart =
                league.settings?.playoff_week_start || 15;


            /*
             * Retrieve every possible fantasy week.
             */

            const weeks =
                Array.from(
                    { length: 18 },
                    (_, index) => index + 1
                );


            const weeklyResponses =
                await Promise.all(

                    weeks.map(week =>
                        fetch(
                            `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`
                        )
                    )

                );


            const games = [];


            for (
                let index = 0;
                index < weeklyResponses.length;
                index++
            ) {

                const response =
                    weeklyResponses[index];

                const week =
                    weeks[index];


                if (!response.ok) {
                    continue;
                }


                const matchups =
                    await response.json();


                if (
                    !Array.isArray(matchups) ||
                    matchups.length === 0
                ) {
                    continue;
                }


                /*
                 * Group entries by Sleeper matchup_id.
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


                /*
                 * A normal matchup should have exactly two teams.
                 */

                Object.entries(matchupGroups)
                    .forEach(([matchupId, entries]) => {

                        if (entries.length !== 2) {
                            return;
                        }


                        const first =
                            entries[0];

                        const second =
                            entries[1];


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


                        let winnerRosterId = null;
                        let loserRosterId = null;
                        let tie = false;


                        if (firstPoints > secondPoints) {

                            winnerRosterId =
                                first.roster_id;

                            loserRosterId =
                                second.roster_id;

                        }

                        else if (secondPoints > firstPoints) {

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
                                Number(league.season),

                            week:
                                week,

                            matchup_id:
                                Number(matchupId),

                            playoff:
                                week >= playoffStart,

                            playoff_start_week:
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

                    });

            }


            seasons.push({

                season:
                    Number(league.season),

                league_id:
                    league.league_id,

                playoff_start_week:
                    playoffStart,

                games_found:
                    games.length,

                games:
                    games

            });


            leagueId =
                league.previous_league_id;

        }


        /*
         * Flatten every season into one master game list.
         */

        const allGames =
            seasons.flatMap(
                season => season.games
            );


        return new Response(

            JSON.stringify(
                {

                    seasons_found:
                        seasons.length,

                    total_games:
                        allGames.length,

                    seasons:
                        seasons,

                    games:
                        allGames

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
