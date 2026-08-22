async function loadManagers() {

    const grid = document.getElementById('managers-grid');

    try {

        const response = await fetch('/api/teams');

        if (!response.ok) {
            throw new Error('Unable to retrieve team data.');
        }

        const data = await response.json();

        if (!data.teams) {
            throw new Error('No teams returned.');
        }


        const teams = [...data.teams].sort(
            (a, b) => a.roster_id - b.roster_id
        );


        grid.innerHTML = '';


        teams.forEach(team => {

            const card = document.createElement('article');

            card.className = 'manager-card';


            const avatar = team.avatar
                ? `
                    <img
                        class="manager-avatar"
                        src="${team.avatar}"
                        alt="${team.team_name}"
                    >
                  `
                : `
                    <div class="manager-avatar manager-avatar-placeholder">
                        ${team.team_name.charAt(0)}
                    </div>
                  `;


            const record =
                `${team.wins}-${team.losses}` +
                (team.ties ? `-${team.ties}` : '');


            card.innerHTML = `

                <div class="manager-card-top">

                    ${avatar}

                    <div class="manager-identity">

                        <span class="manager-number">
                            FRANCHISE ${String(team.roster_id).padStart(2, '0')}
                        </span>

                        <h2>${team.team_name}</h2>

                        <p>${team.owner}</p>

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

                        <span>2026 Record</span>

                        <strong>
                            ${record}
                        </strong>

                    </div>


                    <div class="manager-stat">

                        <span>2026 Points</span>

                        <strong>
                            ${team.points_for.toFixed(2)}
                        </strong>

                    </div>


                    <div class="manager-stat">

                        <span>Seasons</span>

                        <strong>
                            —
                        </strong>

                    </div>


                    <div class="manager-stat">

                        <span>All-Time Record</span>

                        <strong>
                            —
                        </strong>

                    </div>


                    <div class="manager-stat">

                        <span>Championships</span>

                        <strong>
                            —
                        </strong>

                    </div>


                    <div class="manager-stat">

                        <span>Division Titles</span>

                        <strong>
                            —
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

            `;


            grid.appendChild(card);

        });


    } catch (error) {

        console.error(
            'Error loading managers:',
            error
        );


        grid.innerHTML = `

            <div class="manager-loading manager-error">

                Unable to load manager information.

            </div>

        `;

    }

}


loadManagers();
