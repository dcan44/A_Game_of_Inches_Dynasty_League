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


        const sleeperUsername =
            user
                ?.display_name ||
            'Unknown Manager';


        /*
         * Real owner name from league-data.js.
         */

        const ownerName =
            window.LEAGUE_DATA &&
            typeof window.LEAGUE_DATA.getOwnerName ===
                'function'
                ? window.LEAGUE_DATA.getOwnerName(
                    roster.owner_id,
                    sleeperUsername
                  )
                : sleeperUsername;


        /*
         * Sleeper avatar.
         */

        let avatarUrl =
            null;


        if (
            user?.avatar
        ) {

            avatarUrl =
                `https://sleepercdn.com/avatars/${user.avatar}`;

        }


        /*
         * Some users have a custom uploaded avatar
         * stored in metadata instead.
         */

        if (
            user
                ?.metadata
                ?.avatar
        ) {

            avatarUrl =
                user.metadata.avatar;

        }


        rosterMap[
            roster.roster_id
        ] = {

            owner_id:
                roster.owner_id,

            owner:
                ownerName,

            sleeper_username:
                sleeperUsername,

            avatar:
                avatarUrl,

            team_name:
                user
                    ?.metadata
                    ?.team_name
                    ?.trim() ||
                sleeperUsername ||
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


        <div class="
            home-matchup-side
            home-matchup-left
        ">

            <div class="home-matchup-avatar">

                ${
                    firstTeam?.avatar
                        ? `
                            <img
                                src="${firstTeam.avatar}"
                                alt="${firstTeam.owner}"
                            >
                          `
                        : `
                            <span>
                                ${
                                    firstTeam
                                        ?.owner
                                        ?.charAt(0)
                                        ?.toUpperCase() ||
                                    '?'
                                }
                            </span>
                          `
                }

            </div>


<div class="home-matchup-info">

    <span class="home-matchup-team-line">

        ${
            firstTeam
                ?.team_name ||
            'Unknown Team'
        }

    </span>

    <span class="home-matchup-owner-line">

        ${
            firstTeam
                ?.owner ||
            'Unknown Manager'
        }

    </span>

</div>


            <strong class="home-matchup-score">
                ${firstPoints.toFixed(2)}
            </strong>

        </div>


        <div class="home-matchup-vs">
            VS
        </div>


        <div class="
            home-matchup-side
            home-matchup-right
        ">

            <strong class="home-matchup-score">
                ${secondPoints.toFixed(2)}
            </strong>


<div class="home-matchup-info">

    <span class="home-matchup-team-line">

        ${
            secondTeam
                ?.team_name ||
            'Unknown Team'
        }

    </span>

    <span class="home-matchup-owner-line">

        ${
            secondTeam
                ?.owner ||
            'Unknown Manager'
        }

    </span>

</div>


            <div class="home-matchup-avatar">

                ${
                    secondTeam?.avatar
                        ? `
                            <img
                                src="${secondTeam.avatar}"
                                alt="${secondTeam.owner}"
                            >
                          `
                        : `
                            <span>
                                ${
                                    secondTeam
                                        ?.owner
                                        ?.charAt(0)
                                        ?.toUpperCase() ||
                                    '?'
                                }
                            </span>
                          `
                }

            </div>

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
/*
 * ======================================================
 * HOME — RECENT TRANSACTIONS / WAIVER WIRE
 * ======================================================
 */

async function loadHomeTransactions() {

    const transactionsContainer =
        document.getElementById(
            'home-transactions'
        );


    const waiversContainer =
        document.getElementById(
            'home-waivers'
        );


    if (
        !transactionsContainer ||
        !waiversContainer
    ) {

        return;

    }


    try {

        const leagueId =
            "1312098239821914112";


        /*
         * Sleeper transactions are week-based.
         *
         * We use the current NFL week, then work backward
         * until enough recent activity is found.
         */

        const [
            stateResponse,
            usersResponse,
            rostersResponse,
            playersResponse
        ] = await Promise.all([

            fetch(
                'https://api.sleeper.app/v1/state/nfl'
            ),

            fetch(
                `https://api.sleeper.app/v1/league/${leagueId}/users`
            ),

            fetch(
                `https://api.sleeper.app/v1/league/${leagueId}/rosters`
            ),

            fetch(
                'https://api.sleeper.app/v1/players/nfl'
            )

        ]);


        if (
            !stateResponse.ok ||
            !usersResponse.ok ||
            !rostersResponse.ok ||
            !playersResponse.ok
        ) {

            throw new Error(
                'Unable to retrieve transaction data.'
            );

        }


        const nflState =
            await stateResponse.json();


        const users =
            await usersResponse.json();


        const rosters =
            await rostersResponse.json();


        const players =
            await playersResponse.json();


        /*
         * ==================================================
         * USER LOOKUP
         * ==================================================
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
         * ==================================================
         * ROSTER LOOKUP
         * ==================================================
         */

        const rosterMap =
            {};


        rosters.forEach(
            roster => {

                const user =
                    userMap[
                        roster.owner_id
                    ];


                const sleeperUsername =
                    user
                        ?.display_name ||
                    'Unknown Manager';


                const ownerName =
                    window.LEAGUE_DATA &&
                    typeof window.LEAGUE_DATA.getOwnerName ===
                        'function'
                        ? window.LEAGUE_DATA.getOwnerName(
                            roster.owner_id,
                            sleeperUsername
                          )
                        : sleeperUsername;


                rosterMap[
                    roster.roster_id
                ] = {

                    roster_id:
                        roster.roster_id,

                    owner_id:
                        roster.owner_id,

                    owner:
                        ownerName,

                    team_name:
                        user
                            ?.metadata
                            ?.team_name
                            ?.trim() ||
                        sleeperUsername ||
                        `Team ${roster.roster_id}`

                };

            }
        );


        /*
         * ==================================================
         * LOAD RECENT WEEKS
         * ==================================================
         */

        const currentWeek =
            Number(
                nflState.week ||
                1
            );


        const allTransactions =
            [];


        /*
         * Look backward up to 5 weeks.
         *
         * This prevents the Home page from being empty if
         * the current week has little or no activity.
         */

        for (
            let week = currentWeek;
            week >= Math.max(
                1,
                currentWeek - 4
            );
            week--
        ) {

            const response =
                await fetch(
                    `https://api.sleeper.app/v1/league/${leagueId}/transactions/${week}`
                );


            if (
                !response.ok
            ) {

                continue;

            }


            const weekTransactions =
                await response.json();


            weekTransactions.forEach(
                transaction => {

                    allTransactions.push(
                        {
                            ...transaction,
                            week:
                                week
                        }
                    );

                }
            );

        }


        /*
         * Newest first.
         */

        allTransactions.sort(
            (a, b) =>
                Number(
                    b.created ||
                    0
                ) -
                Number(
                    a.created ||
                    0
                )
        );


        /*
         * ==================================================
         * HELPERS
         * ==================================================
         */

        function getPlayerName(
            playerId
        ) {

            const player =
                players[
                    playerId
                ];


            if (
                !player
            ) {

                return playerId;

            }


            return (
                player.full_name ||
                `${player.first_name || ''} ${player.last_name || ''}`.trim() ||
                playerId
            );

        }


        function getRoster(
            rosterId
        ) {

            return rosterMap[
                rosterId
            ] || {

                owner:
                    'Unknown Manager',

                team_name:
                    'Unknown Team'

            };

        }


        /*
         * ==================================================
         * TRANSACTION CARD
         * ==================================================
         */

        function buildTransactionHTML(
            transaction
        ) {

            const type =
                transaction.type;


            const adds =
                transaction.adds ||
                {};


            const drops =
                transaction.drops ||
                {};


            const rosterIds =
                transaction.roster_ids ||
                [];


            /*
             * ==============================================
             * TRADE
             * ==============================================
             */

            if (
                type ===
                'trade'
            ) {

                const teams =
                    rosterIds
                        .map(
                            rosterId => {

                                const roster =
                                    getRoster(
                                        rosterId
                                    );


                                return `
                                    <span>
                                        <strong>
                                            ${roster.team_name}
                                        </strong>
                                        <small>
                                            ${roster.owner}
                                        </small>
                                    </span>
                                `;

                            }
                        )
                        .join(
                            '<span class="home-transaction-arrow">⇄</span>'
                        );


                return `

                    <div class="home-transaction-item">

                        <div class="home-transaction-type">
                            Trade
                        </div>

                        <div class="home-transaction-main">

                            <div class="home-transaction-trade">
                                ${teams}
                            </div>

                            <div class="home-transaction-meta">
                                Week ${transaction.week}
                            </div>

                        </div>

                    </div>

                `;

            }


            /*
             * ==============================================
             * ADD / DROP / WAIVER
             * ==============================================
             */

            const involvedRosterIds =
                new Set();


            Object.values(
                adds
            ).forEach(
                rosterId =>
                    involvedRosterIds.add(
                        rosterId
                    )
            );


            Object.values(
                drops
            ).forEach(
                rosterId =>
                    involvedRosterIds.add(
                        rosterId
                    )
            );


            const firstRosterId =
                [
                    ...involvedRosterIds
                ][0];


            const roster =
                getRoster(
                    firstRosterId
                );


            const addedPlayers =
                Object.keys(
                    adds
                )
                    .map(
                        getPlayerName
                    );


            const droppedPlayers =
                Object.keys(
                    drops
                )
                    .map(
                        getPlayerName
                    );


            let actionHTML =
                '';


            if (
                addedPlayers.length >
                0
            ) {

                actionHTML += `

                    <div class="home-transaction-action add">

                        <span>
                            Added
                        </span>

                        <strong>
                            ${addedPlayers.join(', ')}
                        </strong>

                    </div>

                `;

            }


            if (
                droppedPlayers.length >
                0
            ) {

                actionHTML += `

                    <div class="home-transaction-action drop">

                        <span>
                            Dropped
                        </span>

                        <strong>
                            ${droppedPlayers.join(', ')}
                        </strong>

                    </div>

                `;

            }


            let transactionLabel =
                'Free Agent';


            if (
                type ===
                'waiver'
            ) {

                transactionLabel =
                    'Waiver';

            }


            return `

                <div class="home-transaction-item">

                    <div class="home-transaction-type">
                        ${transactionLabel}
                    </div>

                    <div class="home-transaction-main">

                        <div class="home-transaction-team">

                            <strong>
                                ${roster.team_name}
                            </strong>

                            <span>
                                ${roster.owner}
                            </span>

                        </div>

                        ${actionHTML}

                        <div class="home-transaction-meta">
                            Week ${transaction.week}
                        </div>

                    </div>

                </div>

            `;

        }


        /*
         * ==================================================
         * RECENT TRANSACTIONS
         * ==================================================
         */

        const recentTransactions =
            allTransactions
                .filter(
                    transaction =>
                        transaction.status ===
                        'complete'
                )
                .slice(
                    0,
                    5
                );


        if (
            recentTransactions.length >
            0
        ) {

            transactionsContainer.innerHTML =
                recentTransactions
                    .map(
                        buildTransactionHTML
                    )
                    .join('');

        }

        else {

            transactionsContainer.innerHTML = `

                <p class="placeholder-text">
                    No recent transactions.
                </p>

            `;

        }


        /*
         * ==================================================
         * WAIVER WIRE
         * ==================================================
         */

        const recentWaivers =
            allTransactions
                .filter(
                    transaction =>
                        transaction.status ===
                            'complete' &&
                        transaction.type ===
                            'waiver'
                )
                .slice(
                    0,
                    5
                );


        if (
            recentWaivers.length >
            0
        ) {

            waiversContainer.innerHTML =
                recentWaivers
                    .map(
                        buildTransactionHTML
                    )
                    .join('');

        }

        else {

            waiversContainer.innerHTML = `

                <p class="placeholder-text">
                    No recent waiver claims.
                </p>

            `;

        }


    } catch (
        error
    ) {

        console.error(
            'Error loading home transactions:',
            error
        );


        transactionsContainer.innerHTML = `

            <p class="placeholder-text">
                Unable to load recent transactions.
            </p>

        `;


        waiversContainer.innerHTML = `

            <p class="placeholder-text">
                Unable to load waiver claims.
            </p>

        `;

    }

}


loadHomeTransactions();
