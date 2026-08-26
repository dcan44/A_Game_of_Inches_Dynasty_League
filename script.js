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
async function loadHomeSeason() {

    const homeSeasonLabel =
        document.getElementById(
            'home-season-label'
        );


    const seasonHeroTitle =
        document.getElementById(
            'season-hero-title'
        );


    try {

        const response =
            await fetch(
                'https://api.sleeper.app/v1/league/1312098239821914112'
            );


        if (
            !response.ok
        ) {

            throw new Error(
                'Unable to load Sleeper league.'
            );

        }


        const league =
            await response.json();


        if (
            homeSeasonLabel &&
            league.season
        ) {

            homeSeasonLabel.textContent =
                `${league.season} Season`;

        }


        if (
            seasonHeroTitle &&
            league.season
        ) {

            seasonHeroTitle.textContent =
                `${league.season} Season`;

        }


    } catch (
        error
    ) {

        console.error(
            'Error loading season:',
            error
        );

    }

}


loadHomeSeason();
async function loadHomeMatchups() {

    const weekNumber =
        document.getElementById(
            'home-week-number'
        );


    const matchupsContainer =
        document.getElementById(
            'home-matchups'
        );


    try {

        const [
            stateResponse,
            leagueResponse,
            usersResponse,
            rostersResponse
        ] = await Promise.all([

            fetch(
                'https://api.sleeper.app/v1/state/nfl'
            ),

            fetch(
                'https://api.sleeper.app/v1/league/1312098239821914112'
            ),

            fetch(
                'https://api.sleeper.app/v1/league/1312098239821914112/users'
            ),

            fetch(
                'https://api.sleeper.app/v1/league/1312098239821914112/rosters'
            )

        ]);


        if (
            !stateResponse.ok ||
            !leagueResponse.ok ||
            !usersResponse.ok ||
            !rostersResponse.ok
        ) {

            throw new Error(
                'Unable to load matchup data.'
            );

        }


        const nflState =
            await stateResponse.json();


        const league =
            await leagueResponse.json();


        const users =
            await usersResponse.json();


        const rosters =
            await rostersResponse.json();


        /*
         * Sleeper's current NFL week.
         */

        let currentWeek =
            Number(
                nflState.week ||
                1
            );


        /*
         * Prevent offseason NFL state from showing
         * a meaningless week on the fantasy site.
         */

        if (
            league.status !==
            'in_season'
        ) {

            currentWeek =
                1;

        }


        const matchupsResponse =
            await fetch(
                `https://api.sleeper.app/v1/league/1312098239821914112/matchups/${currentWeek}`
            );


        if (
            !matchupsResponse.ok
        ) {

            throw new Error(
                'Unable to load weekly matchups.'
            );

        }


        const matchups =
            await matchupsResponse.json();


        /*
         * User lookup
         */

        const userMap =
            {};


        users.forEach(
            user => {

                userMap[
                    user.user_id
                ] =
                    user;

            }
        );


        /*
         * Roster lookup
         */

        const rosterMap =
            {};


        rosters.forEach(
            roster => {

                const user =
                    userMap[
                        roster.owner_id
                    ];


                rosterMap[
                    roster.roster_id
                ] = {

                    owner_id:
                        roster.owner_id,

                    owner:
                        user
                            ?.display_name ||
                        'Unknown Manager',

                    team_name:
                        user
                            ?.metadata
                            ?.team_name
                            ?.trim() ||
                        user
                            ?.display_name ||
                        `Team ${roster.roster_id}`

                };

            }
        );


        /*
         * Group matchup entries by matchup_id.
         */

        const matchupGroups =
            {};


        matchups.forEach(
            matchup => {

                if (
                    matchup.matchup_id ===
                    null
                ) {

                    return;

                }


                if (
                    !matchupGroups[
                        matchup.matchup_id
                    ]
                ) {

                    matchupGroups[
                        matchup.matchup_id
                    ] =
                        [];

                }


                matchupGroups[
                    matchup.matchup_id
                ].push(
                    matchup
                );

            }
        );


        weekNumber.textContent =
            `Week ${currentWeek}`;


        const matchupCards =
            Object.values(
                matchupGroups
            )
                .filter(
                    matchup =>
                        matchup.length ===
                        2
                )
                .map(
                    matchup => {

                        const first =
                            matchup[0];


                        const second =
                            matchup[1];


                        const firstTeam =
                            rosterMap[
                                first.roster_id
                            ];


                        const secondTeam =
                            rosterMap[
                                second.roster_id
                            ];


                        const firstPoints =
                            Number(
                                first.points ||
                                0
                            );


                        const secondPoints =
                            Number(
                                second.points ||
                                0
                            );


                        return `

                            <div class="home-matchup-card">

                                <div class="home-matchup-team">

                                    <span>
                                        ${
                                            firstTeam
                                                ?.team_name ||
                                            'Unknown Team'
                                        }
                                    </span>

                                    <strong>
                                        ${firstPoints.toFixed(2)}
                                    </strong>

                                </div>


                                <div class="home-matchup-vs">
                                    VS
                                </div>


                                <div class="home-matchup-team">

                                    <span>
                                        ${
                                            secondTeam
                                                ?.team_name ||
                                            'Unknown Team'
                                        }
                                    </span>

                                    <strong>
                                        ${secondPoints.toFixed(2)}
                                    </strong>

                                </div>

                            </div>

                        `;

                    }
                )
                .join('');


        if (
            matchupCards
        ) {

            matchupsContainer.innerHTML =
                matchupCards;

        }

        else {

            matchupsContainer.innerHTML = `

                <div class="matchup-placeholder">

                    Matchups are not available yet.

                </div>

            `;

        }


    } catch (
        error
    ) {

        console.error(
            'Error loading home matchups:',
            error
        );


        if (
            weekNumber
        ) {

            weekNumber.textContent =
                'This Week';

        }


        if (
            matchupsContainer
        ) {

            matchupsContainer.innerHTML = `

                <div class="matchup-placeholder">

                    Unable to load weekly matchups.

                </div>

            `;

        }

    }

}


loadHomeMatchups();
