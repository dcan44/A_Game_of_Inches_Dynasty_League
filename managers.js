async function loadManagers() {

    const grid = document.getElementById('managers-grid');

    try {

        /*
         * Load current team information and historical
         * career statistics at the same time.
         */

        const [teamsResponse, careerResponse] =
            await Promise.all([
                fetch('/api/teams'),
                fetch('/api/career-stats')
            ]);


        if (!teamsResponse.ok || !careerResponse.ok) {
            throw new Error(
                'Unable to retrieve manager data.'
            );
        }


        const teamsData =
            await teamsResponse.json();

        const careerData =
            await careerResponse.json();


        if (!teamsData.teams) {
            throw new Error(
                'No current teams returned.'
            );
        }


        /*
         * Create a lookup table using Sleeper owner_id.
         */

        const careerMap = {};


        if (careerData.managers) {

            careerData.managers.forEach(manager => {

                careerMap[manager.owner_id] =
                    manager;

            });

        }


        /*
         * Keep current franchises in roster order.
         */

        const teams =
            [...teamsData.teams].sort(
                (a, b) =>
                    a.roster_id -
                    b.roster_id
            );


        grid.innerHTML = '';


        teams.forEach(team => {

            const career =
                careerMap[team.owner_id];


            const card =
                document.createElement('article');


            card.className =
                'manager-card';


            /*
             * Team / manager avatar
             */

            const avatar =
                team.avatar
                    ? `
                        <img
                            class="manager-avatar"
                            src="${team.avatar}"
                            alt="${team.team_name}"
                        >
                      `
                    : `
                        <div
                            class="
                                manager-avatar
                                manager-avatar-placeholder
                            "
                        >
                            ${team.team_name.charAt(0)}
                        </div>
                      `;


            /*
             * Current-season record
             */

            const currentRecord =
                `${team.wins}-${team.losses}` +
                (
                    team.ties
                        ? `-${team.ties}`
                        : ''
                );


            /*
             * Career record
             */

            let careerRecord = '—';

            if (career) {

                careerRecord =
                    `${career.wins}-${career.losses}`;

                if (career.ties) {

                    careerRecord +=
                        `-${career.ties}`;

                }

            }


            /*
             * Winning percentage
             */

            let winningPercentage = '—';

            if (
                career &&
                career.games > 0
            ) {

                winningPercentage =
                    (
                        career.winning_percentage *
                        100
                    ).toFixed(1) + '%';

            }


            /*
             * Historical team names
             */

            let historicalNames = '';

            if (
                career &&
                career.historical_team_names &&
                career.historical_team_names.length > 1
            ) {

                const oldNames =
                    career.historical_team_names
                        .filter(
                            name =>
                                name !==
                                team.team_name
                        );


                if (oldNames.length > 0) {

                    historicalNames = `

                        <div class="manager-history">

                            <span>
                                Former Team Names
                            </span>

                            <p>
                                ${oldNames.join(' • ')}
                            </p>

                        </div>

                    `;

                }

            }


            card.innerHTML = `

                <div class="manager-card-top">

                    ${avatar}

                    <div class="manager-identity">

                        <span class="manager-number">
                            FRANCHISE ${String(
                                team.roster_id
                            ).padStart(2, '0')}
                        </span>

                        <h2>
                            ${team.team_name}
                        </h2>

                        <p>
                            ${team.owner}
                        </p>

                    </div>

                </div>


                <div class="manager-division">

                    ${team.division}

                </div>


                <div class="trophy-case">

                    <div class="trophy-case-title">
                        Trophy Case
                    </div>

                    <div class="trophy-case-content">
                        Historical honors coming soon
                    </div>

                </div>


                <div class="manager-stats">

                    <div class="manager-stat">

                        <span>
                            2026 Record
                        </span>

                        <strong>
                            ${currentRecord}
                        </strong>

                    </div>


                    <div class="manager-stat">

                        <span>
                            2026 Points
                        </span>

                        <strong>
                            ${team.points_for.toFixed(2)}
                        </strong>

                    </div>


                    <div class="manager-stat">

                        <span>
                            Seasons
                        </span>

                        <strong>
                            ${
                                career
                                    ? career.seasons_played
                                    : '—'
                            }
                        </strong>

                    </div>


                    <div class="manager-stat">

                        <span>
                            All-Time Record
                        </span>

                        <strong>
                            ${careerRecord}
                        </strong>

                    </div>


                    <div class="manager-stat">

                        <span>
                            Win %
                        </span>

                        <strong>
                            ${winningPercentage}
                        </strong>

                    </div>


                    <div class="manager-stat">

                        <span>
                            Career PPG
                        </span>

                        <strong>
                            ${
                                career
                                    ? career.points_per_game
                                        .toFixed(2)
                                    : '—'
                            }
                        </strong>

                    </div>

                </div>


                <div class="manager-records">

                    <div>

                        <span>
                            Highest Player Score
                        </span>

                        <strong>
                            Coming Soon
                        </strong>

                    </div>


                    <div>

                        <span>
                            Highest Team Score
                        </span>

                        <strong>
                            Coming Soon
                        </strong>

                    </div>

                </div>


                ${historicalNames}

            `;


            grid.appendChild(card);

        });


    } catch (error) {

        console.error(
            'Error loading managers:',
            error
        );


        grid.innerHTML = `

            <div
                class="
                    manager-loading
                    manager-error
                "
            >

                Unable to load manager information.

            </div>

        `;

    }

}


loadManagers();
