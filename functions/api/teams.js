export async function onRequestGet() {
    const leagueId = "1312098239821914112";

    try {
        const [leagueResponse, usersResponse, rostersResponse] =
            await Promise.all([
                fetch(`https://api.sleeper.app/v1/league/${leagueId}`),
                fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`),
                fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`)
            ]);

        if (
            !leagueResponse.ok ||
            !usersResponse.ok ||
            !rostersResponse.ok
        ) {
            throw new Error("Unable to retrieve Sleeper data.");
        }

        const league = await leagueResponse.json();
        const users = await usersResponse.json();
        const rosters = await rostersResponse.json();

        const userMap = {};

        users.forEach(user => {
            userMap[user.user_id] = user;
        });

        const divisions = {
            1: league.metadata?.division_1 || "Division 1",
            2: league.metadata?.division_2 || "Division 2",
            3: league.metadata?.division_3 || "Division 3"
        };

        const teams = rosters.map(roster => {
            const user = userMap[roster.owner_id];

            const wholePoints = roster.settings?.fpts || 0;
            const decimalPoints = roster.settings?.fpts_decimal || 0;

            const pointsFor =
                wholePoints + (decimalPoints / 100);

            return {
                roster_id: roster.roster_id,

                owner_id: roster.owner_id,

                owner: user?.display_name || "Unknown Owner",

                team_name:
                    user?.metadata?.team_name?.trim() ||
                    user?.display_name ||
                    `Team ${roster.roster_id}`,

                avatar:
                    user?.metadata?.avatar ||
                    (user?.avatar
                        ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}`
                        : null),

                division_id: roster.settings?.division || null,

                division:
                    divisions[roster.settings?.division] ||
                    "No Division",

                wins: roster.settings?.wins || 0,

                losses: roster.settings?.losses || 0,

                ties: roster.settings?.ties || 0,

                points_for: pointsFor,

                waiver_position:
                    roster.settings?.waiver_position || null,

                faab_used:
                    roster.settings?.waiver_budget_used || 0,

                players: roster.players || [],

                starters: roster.starters || [],

                reserve: roster.reserve || [],

                taxi: roster.taxi || []
            };
        });

        return new Response(
            JSON.stringify(
                {
                    league: league.name,
                    season: league.season,
                    divisions,
                    teams
                },
                null,
                2
            ),
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (error) {

        return new Response(
            JSON.stringify({
                error: error.message
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
}
