async function loadManagers() {

    const grid =
        document.getElementById('managers-grid');

    try {

        /*
         * =====================================================
         * LOAD DATA
         * =====================================================
         *
         * Current teams come from /api/teams.
         *
         * Historical performance is requested one season
         * at a time. This avoids Cloudflare's Worker
         * subrequest limits.
         */

        const [
            teamsResponse,
            performance2023Response,
            performance2024Response,
            performance2025Response,
            performance2026Response
        ] = await Promise.all([

            fetch('/api/teams'),

            fetch(
                '/api/manager-performance?season=2023'
            ),

            fetch(
                '/api/manager-performance?season=2024'
            ),

            fetch(
                '/api/manager-performance?season=2025'
            ),

            fetch(
                '/api/manager-performance?season=2026'
            )

        ]);


        /*
         * Make sure every request succeeded.
         */

        const responses = [

            teamsResponse,
            performance2023Response,
            performance2024Response,
            performance2025Response,
            performance2026Response

        ];


        if (
            responses.some(
                response => !response.ok
            )
        ) {

            throw new Error(
                'Unable to retrieve manager data.'
            );

        }


        /*
         * Convert responses to JSON.
         */

        const teamsData =
            await teamsResponse.json();


        const performanceData = [

            await performance2023Response.json(),

            await performance2024Response.json(),

            await performance2025Response.json(),

            await performance2026Response.json()

        ];


        if (!teamsData.teams) {

            throw new Error(
                'No current teams returned.'
            );

        }


        /*
         * =====================================================
         * BUILD CAREER STATISTICS
         * =====================================================
         */

        const careerMap = {};


        performanceData.forEach(
            seasonData => {

                if (!seasonData.managers) {
                    return;
                }


                seasonData.managers.forEach(
                    manager => {


                        /*
                         * Create manager if this is the
                         * first season we've encountered.
                         */

                        if (
                            !careerMap[
                                manager.owner_id
                            ]
                        ) {

                            careerMap[
                                manager.owner_id
                            ] = {

                                owner_id:
                                    manager.owner_id,

                                owner:
                                    manager.owner,

                                seasons:
                                    0,

                                regular_wins:
                                    0,

                                regular_losses:
                                    0,

                                regular_ties:
                                    0,

                                playoff_wins:
                                    0,

                                playoff_losses:
                                    0,

                                playoff_ties:
                                    0,

                                points_for:
                                    0,

                                points_against:
                                    0,

                                regular_games:
                                    0,

                                highest_team_score:
                                    null

                            };

                        }


                        const career =
                            careerMap[
                                manager.owner_id
                            ];


                        /*
                         * Count season played.
                         *
                         * 2026 will count once actual games
                         * have been played.
                         */

                        if (
                            manager.regular_season.games > 0
                        ) {

                            career.seasons++;

                        }


                        /*
                         * Regular-season record
                         */

                        career.regular_wins +=
                            manager.regular_season.wins;

                        career.regular_losses +=
                            manager.regular_season.losses;

                        career.regular_ties +=
                            manager.regular_season.ties;

                        career.regular_games +=
                            manager.regular_season.games;


                        /*
                         * Championship playoff record
                         */

                        career.playoff_wins +=
                            manager.playoffs.wins;

                        career.playoff_losses +=
                            manager.playoffs.losses;

                        career.playoff_ties +=
                            manager.playoffs.ties;


                        /*
                         * Career regular-season scoring
                         */

                        career.points_for +=
                            manager.scoring.points_for;

                        career.points_against +=
                            manager.scoring.points_against;


                        /*
                         * Highest single-game team score
                         */

                        if (
                            manager.highest_team_score &&
                            (
                                !career.highest_team_score ||
                                manager.highest_team_score.points >
                                career.highest_team_score.points
                            )
                        ) {

                            career.highest_team_score = {

                                ...manager.highest_team_score

                            };

                        }

                    }

                );

            }

        );


        /*
         * =====================================================
         * CURRENT TEAMS
         * =====================================================
         */

        const teams =
            [...teamsData.teams].sort(
                (a, b) =>
                    a.roster_id -
                    b.roster_id
            );


        grid.innerHTML = '';


        /*
         * =====================================================
         * BUILD EACH MANAGER CARD
         * =====================================================
         */

        teams.forEach(team => {

            const career =
                careerMap[
                    team.owner_id
                ];


            const card =
                document.createElement(
                    'article'
                );


            card.className =
                'manager-card';


            /*
             * Avatar
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
             * Regular-season career record
             */

            let regularRecord = '—';


            if (career) {

                regularRecord =
                    `${career.regular_wins}-${career.regular_losses}`;


                if (
                    career.regular_ties > 0
                ) {

                    regularRecord +=
                        `-${career.regular_ties}`;

                }

            }


            /*
             * Playoff record
             */

            let playoffRecord =
                '0-0';


            if (career) {

                playoffRecord =
                    `${career.playoff_wins}-${career.playoff_losses}`;


                if (
                    career.playoff_ties > 0
                ) {

                    playoffRecord +=
                        `-${career.playoff_ties}`;

                }

            }


            /*
             * Career winning percentage
             */

            let winningPercentage =
                '—';


            if (
                career &&
                career.regular_games > 0
            ) {

                const percentage =
                    (
                        career.regular_wins +
                        (
                            career.regular_ties *
                            0.5
                        )
                    )
                    /
                    career.regular_games;


                winningPercentage =
                    (
                        percentage *
                        100
                    ).toFixed(1) + '%';

            }


            /*
             * Career PPG
             */

            let careerPPG =
                '—';


            if (
                career &&
                career.regular_games > 0
            ) {

                careerPPG =
                    (
                        career.points_for /
                        career.regular_games
                    ).toFixed(2);

            }


            /*
             * Highest team score
             */

            let highestTeamScore =
                'Coming Soon';


            if (
                career &&
                career.highest_team_score
            ) {

                highestTeamScore =
                    `
                        ${career.highest_team_score.points.toFixed(2)}
                        <small>
                            Week ${career.highest_team_score.week},
                            ${career.highest_team_score.season}
                        </small>
                    `;

            }


            /*
             * =================================================
             * CARD HTML
             * =================================================
             */

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

                    ${team.division || 'Division'}

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
                            Seasons
                        </span>

                        <strong>
                            ${
                                career
                                    ? career.seasons
                                    : '—'
                            }
                        </strong>

                    </div>


                    <div class="manager-stat">

                        <span>
                            Regular Season
                        </span>

                        <strong>
                            ${regularRecord}
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
                            Playoffs
                        </span>

                        <strong>
                            ${playoffRecord}
                        </strong>

                    </div>


                    <div class="manager-stat">

                        <span>
                            Career PPG
                        </span>

                        <strong>
                            ${careerPPG}
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
                            ${highestTeamScore}
                        </strong>

                    </div>


                </div>

            `;


            grid.appendChild(
                card
            );

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
