export async function onRequestGet() {

    const currentLeagueId = "1312098239821914112";

    try {

        const seasons = [];
        let leagueId = currentLeagueId;

        // Follow the league chain backward.
        for (let i = 0; i < 10 && leagueId; i++) {

            const leagueResponse = await fetch(
                `https://api.sleeper.app/v1/league/${leagueId}`
            );

            if (!leagueResponse.ok) {
                break;
            }

            const league = await leagueResponse.json();

            const [usersResponse, rostersResponse] =
                await Promise.all([
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

            const userMap = {};

            users.forEach(user => {
                userMap[user.user_id] = user;
            });

            const teams = rosters.map(roster => {

                const user = userMap[roster.owner_id];

                const wholePoints =
                    roster.settings?.fpts || 0;

                const decimalPoints =
                    roster.settings?.fpts_decimal || 0;

                const pointsFor =
                    wholePoints +
                    (decimalPoints / 100);


                const wholeAgainst =
                    roster.settings?.fpts_against || 0;

                const decimalAgainst =
                    roster.settings?.fpts_against_decimal || 0;

                const pointsAgainst =
                    wholeAgainst +
                    (decimalAgainst / 100);


                return {

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
                        `Team ${roster.roster_id}`,

                    wins:
                        roster.settings?.wins || 0,

                    losses:
                        roster.settings?.losses || 0,

                    ties:
                        roster.settings?.ties || 0,

                    points_for:
                        pointsFor,

                    points_against:
                        pointsAgainst

                };

            });


            seasons.push({

                season:
                    Number(league.season),

                league_id:
                    league.league_id,

                status:
                    league.status,

                teams:
                    teams

            });


            leagueId =
                league.previous_league_id;

        }


        /*
         * Determine which managers are currently active.
         * We use the most recent season returned.
         */

        const currentSeason =
            seasons.length > 0
                ? seasons[0]
                : null;


        const currentOwnerIds =
            new Set(
                currentSeason
                    ? currentSeason.teams
                        .map(team => team.owner_id)
                        .filter(Boolean)
                    : []
            );


        /*
         * Aggregate all manager history by Sleeper owner_id.
         */

        const managerMap = {};


        seasons.forEach(season => {

            season.teams.forEach(team => {

                if (!team.owner_id) {
                    return;
                }


                if (!managerMap[team.owner_id]) {

                    managerMap[team.owner_id] = {

                        owner_id:
                            team.owner_id,

                        owner:
                            team.owner,

                        current_manager:
                            currentOwnerIds.has(
                                team.owner_id
                            ),

                        seasons:
                            new Set(),

                        historical_team_names:
                            new Set(),

                        wins:
                            0,

                        losses:
                            0,

                        ties:
                            0,

                        points_for:
                            0,

                        points_against:
                            0,

                        games:
                            0

                    };

                }


                const manager =
                    managerMap[team.owner_id];


                manager.seasons.add(
                    season.season
                );


                if (team.team_name) {

                    manager
                        .historical_team_names
                        .add(team.team_name);

                }


                manager.wins +=
                    team.wins;

                manager.losses +=
                    team.losses;

                manager.ties +=
                    team.ties;

                manager.points_for +=
                    team.points_for;

                manager.points_against +=
                    team.points_against;


                manager.games +=
                    team.wins +
                    team.losses +
                    team.ties;

            });

        });


        /*
         * Convert Sets and calculate derived stats.
         */

        const managers =
            Object.values(managerMap)
                .map(manager => {

                    const decisions =
                        manager.wins +
                        manager.losses +
                        manager.ties;


                    /*
                     * Sleeper fantasy leagues almost never tie,
                     * but if one occurs we count it as half a win
                     * for winning percentage.
                     */

                    const winningPercentage =
                        decisions > 0
                            ? (
                                (
                                    manager.wins +
                                    (manager.ties * 0.5)
                                )
                                /
                                decisions
                            )
                            : 0;


                    const pointsPerGame =
                        manager.games > 0
                            ? (
                                manager.points_for /
                                manager.games
                            )
                            : 0;


                    const pointsAllowedPerGame =
                        manager.games > 0
                            ? (
                                manager.points_against /
                                manager.games
                            )
                            : 0;


                    const seasonList =
                        Array.from(manager.seasons)
                            .sort(
                                (a, b) => a - b
                            );


                    const teamNames =
                        Array.from(
                            manager.historical_team_names
                        );


                    return {

                        owner_id:
                            manager.owner_id,

                        owner:
                            manager.owner,

                        current_manager:
                            manager.current_manager,

                        seasons_played:
                            seasonList.length,

                        seasons:
                            seasonList,

                        historical_team_names:
                            teamNames,

                        wins:
                            manager.wins,

                        losses:
                            manager.losses,

                        ties:
                            manager.ties,

                        games:
                            manager.games,

                        winning_percentage:
                            Number(
                                winningPercentage
                                    .toFixed(4)
                            ),

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
                            Number(
                                pointsPerGame
                                    .toFixed(2)
                            ),

                        points_allowed_per_game:
                            Number(
                                pointsAllowedPerGame
                                    .toFixed(2)
                            )

                    };

                });


        /*
         * Current managers first, then alphabetical.
         */

        managers.sort((a, b) => {

            if (
                a.current_manager !==
                b.current_manager
            ) {

                return a.current_manager
                    ? -1
                    : 1;

            }

            return a.owner.localeCompare(
                b.owner
            );

        });


        return new Response(

            JSON.stringify(
                {
                    seasons_found:
                        seasons.length,

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
