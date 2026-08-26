async function loadStandings() {
    try {
        const response = await fetch('/api/teams');
        const data = await response.json();

        const standingsBody = document.getElementById('standings-body');

        if (!data.teams) {
            standingsBody.innerHTML =
                '<tr><td colspan="4">Unable to load standings.</td></tr>';
            return;
        }

        const sortedTeams = data.teams.sort((a, b) => {
            if (b.wins !== a.wins) {
                return b.wins - a.wins;
            }

            return b.points_for - a.points_for;
        });

        standingsBody.innerHTML = '';

        sortedTeams.forEach(team => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${team.team_name}</td>
                <td>${team.wins}</td>
                <td>${team.losses}</td>
                <td>${team.points_for.toFixed(2)}</td>
            `;

            standingsBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading standings:', error);

        document.getElementById('standings-body').innerHTML =
            '<tr><td colspan="4">Unable to load standings.</td></tr>';
    }
}

loadStandings();
const homeSeasonLabel =
    document.getElementById(
        'home-season-label'
    );


if (
    homeSeasonLabel &&
    league.season
) {

    homeSeasonLabel.textContent =
        `${league.season} Season`;

}
