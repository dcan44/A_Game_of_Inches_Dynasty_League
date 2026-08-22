export async function onRequestGet() {
    const leagueId = "1312098239821914112";

    const response = await fetch(
        `https://api.sleeper.app/v1/league/${leagueId}/rosters`
    );

    if (!response.ok) {
        return new Response(
            JSON.stringify({ error: "Unable to retrieve Sleeper rosters." }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }

    const rosters = await response.json();

    return new Response(
        JSON.stringify(rosters, null, 2),
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}
