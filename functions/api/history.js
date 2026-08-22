export async function onRequestGet() {

    const currentLeagueId = "1312098239821914112";

    try {

        const seasons = [];

        let leagueId = currentLeagueId;

        // Maximum of 10 seasons as a safety limit
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
                        pointsAgainst,

                    division:
                        roster.settings?.division || null

                };

            });


            seasons.push({

                season:
                    league.season,

                league_id:
                    league.league_id,

                previous_league_id:
                    league.previous_league_id,

                status:
                    league.status,

                teams:
                    teams

            });


            leagueId =
                league.previous_league_id;

        }


        return new Response(

            JSON.stringify(
                {
                    seasons_found:
                        seasons.length,

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
