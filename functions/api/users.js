export async function onRequestGet() {
    const leagueId = "1312098239821914112";

    const response = await fetch(
        `https://api.sleeper.app/v1/league/${leagueId}/users`
    );

    if (!response.ok) {
        return new Response(
            JSON.stringify({ error: "Unable to retrieve Sleeper users." }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }

    const users = await response.json();

    return new Response(
        JSON.stringify(users, null, 2),
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}
