async function loadStandings() {

    try {

        const leagueId =
            "1312098239821914112";


        const [
            teamsResponse,
            rostersResponse
        ] = await Promise.all([

            fetch(
                '/api/teams'
            ),

            fetch(
                `https://api.sleeper.app/v1/league/${leagueId}/rosters`
            )

        ]);


        if (
            !teamsResponse.ok ||
            !rostersResponse.ok
        ) {

            throw new Error(
                'Unable to load standings.'
            );

        }


        const data =
            await teamsResponse.json();


        const rosters =
            await rostersResponse.json();


        const standingsBody =
            document.getElementById(
                'standings-body'
            );


        if (
            !data.teams
        ) {

            standingsBody.innerHTML = `

                <tr>

                    <td colspan="5">
                        Unable to load standings.
                    </td>

                </tr>

            `;

            return;

        }


        /*
         * ==================================================
         * DIVISION LOOKUP
         * ==================================================
         *
         * Sleeper stores division on the roster settings.
         *
         * We map both roster ID and owner ID so this still
         * works regardless of which identifier /api/teams
         * supplies.
         */

        const divisionByRosterId =
            {};


        const divisionByOwnerId =
            {};


        rosters.forEach(
            roster => {

                const division =
                    Number(
                        roster
                            ?.settings
                            ?.division
                    );


                if (
                    Number.isFinite(
                        division
                    )
                ) {

                    divisionByRosterId[
                        String(
                            roster.roster_id
                        )
                    ] =
                        division;


                    if (
                        roster.owner_id
                    ) {

                        divisionByOwnerId[
                            String(
                                roster.owner_id
                            )
                        ] =
                            division;

                    }

                }

            }
        );


        /*
         * Add the division to each standings team.
         */

        const teams =
            data.teams.map(
                team => {

                    let division =
                        null;


                    if (
                        team.roster_id !==
                            undefined &&
                        divisionByRosterId[
                            String(
                                team.roster_id
                            )
                        ] !==
                            undefined
                    ) {

                        division =
                            divisionByRosterId[
                                String(
                                    team.roster_id
                                )
                            ];

                    }

                    else if (
                        team.owner_id &&
                        divisionByOwnerId[
                            String(
                                team.owner_id
                            )
                        ] !==
                            undefined
                    ) {

                        division =
                            divisionByOwnerId[
                                String(
                                    team.owner_id
                                )
                            ];

                    }


                    return {

                        ...team,

                        division:
                            division

                    };

                }
            );


        /*
         * ==================================================
         * STANDINGS SORT
         * ==================================================
         *
         * Record first.
         * Points For is the tiebreaker.
         */

        const sortStandings =
            (
                a,
                b
            ) => {

                if (
                    Number(b.wins) !==
                    Number(a.wins)
                ) {

                    return (
                        Number(b.wins) -
                        Number(a.wins)
                    );

                }


                return (
                    Number(
                        b.points_for
                    ) -
                    Number(
                        a.points_for
                    )
                );

            };


        /*
         * ==================================================
         * FIND DIVISION WINNERS
         * ==================================================
         */

        const divisionGroups =
            {};


        teams.forEach(
            team => {

                if (
                    team.division ===
                    null
                ) {

                    return;

                }


                if (
                    !divisionGroups[
                        team.division
                    ]
                ) {

                    divisionGroups[
                        team.division
                    ] =
                        [];

                }


                divisionGroups[
                    team.division
                ].push(
                    team
                );

            }
        );


        const divisionWinners =
            Object.values(
                divisionGroups
            )
                .map(
                    divisionTeams =>

                        [
                            ...divisionTeams
                        ]
                            .sort(
                                sortStandings
                            )[0]

                )
                .filter(
                    Boolean
                );


        /*
         * ==================================================
         * DETERMINE BYES
         * ==================================================
         *
         * The two best division winners receive Week 15
         * byes.
         */

        const rankedDivisionWinners =
            [
                ...divisionWinners
            ]
                .sort(
                    sortStandings
                );


        const byeTeams =
            new Set(
                rankedDivisionWinners
                    .slice(
                        0,
                        2
                    )
                    .map(
                        team =>
                            String(
                                team.roster_id ??
                                team.owner_id
                            )
                    )
            );


        const divisionWinnerTeams =
            new Set(
                divisionWinners.map(
                    team =>
                        String(
                            team.roster_id ??
                            team.owner_id
                        )
                )
            );


        /*
         * ==================================================
         * FIND WILD CARDS
         * ==================================================
         *
         * Remove the three division winners.
         *
         * Rank every remaining team by:
         *
         * 1. Record
         * 2. Points For
         *
         * The top three are Wild Cards.
         */

        const wildCards =
            teams
                .filter(
                    team => {

                        const teamId =
                            String(
                                team.roster_id ??
                                team.owner_id
                            );


                        return (
                            !divisionWinnerTeams.has(
                                teamId
                            )
                        );

                    }
                )
                .sort(
                    sortStandings
                )
                .slice(
                    0,
                    3
                );


        const wildCardTeams =
            new Set(
                wildCards.map(
                    team =>
                        String(
                            team.roster_id ??
                            team.owner_id
                        )
                )
            );


        /*
         * ==================================================
         * PLAYOFF STATUS
         * ==================================================
         */

        function getPlayoffStatus(
            team
        ) {

            const teamId =
                String(
                    team.roster_id ??
                    team.owner_id
                );


            if (
                byeTeams.has(
                    teamId
                )
            ) {

                return `

                    <span
                        class="
                            playoff-badge
                            playoff-bye
                        "
                    >
                        Division Winner • Bye
                    </span>

                `;

            }


            if (
                divisionWinnerTeams.has(
                    teamId
                )
            ) {

                return `

                    <span
                        class="
                            playoff-badge
                            playoff-division
                        "
                    >
                        Division Winner
                    </span>

                `;

            }


            if (
                wildCardTeams.has(
                    teamId
                )
            ) {

                return `

                    <span
                        class="
                            playoff-badge
                            playoff-wildcard
                        "
                    >
                        Wild Card
                    </span>

                `;

            }


            return `

                <span
                    class="
                        playoff-badge
                        playoff-toilet
                    "
                >
                    Toilet Bowl
                </span>

            `;

        }


        /*
         * ==================================================
         * DISPLAY OVERALL STANDINGS
         * ==================================================
         */

        const sortedTeams =
            [
                ...teams
            ]
                .sort(
                    sortStandings
                );


        standingsBody.innerHTML =
            '';


        sortedTeams.forEach(
            team => {

                const row =
                    document.createElement(
                        'tr'
                    );


                row.innerHTML = `

                    <td>
                        ${team.team_name}
                    </td>

                    <td>
                        ${team.wins}
                    </td>

                    <td>
                        ${team.losses}
                    </td>

                    <td>
                        ${
                            Number(
                                team.points_for
                            ).toFixed(2)
                        }
                    </td>

                    <td>
                        ${getPlayoffStatus(team)}
                    </td>

                `;


                standingsBody.appendChild(
                    row
                );

            }
        );


    } catch (
        error
    ) {

        console.error(
            'Error loading standings:',
            error
        );


        document
            .getElementById(
                'standings-body'
            )
            .innerHTML = `

                <tr>

                    <td colspan="5">
                        Unable to load standings.
                    </td>

                </tr>

            `;

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

/*
 * Determine the fantasy week.
 *
 * Sleeper's NFL week can advance during preseason.
 * Before the NFL regular season begins, the fantasy
 * league should continue displaying Week 1.
 */

let currentWeek =
    Number(
        nflState.week ||
        1
    );


if (
    nflState.season_type !==
    'regular'
) {

    currentWeek =
        1;

}


/*
 * Safety check.
 */

if (
    currentWeek < 1
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
                (
                    transaction.type ===
                        'waiver' ||
                    transaction.type ===
                        'free_agent'
                ) &&
                transaction.adds &&
                Object.keys(
                    transaction.adds
                ).length > 0
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
                    No recent waiver or free-agent activity.
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
/*
 * ======================================================
 * HOME — LEAGUE CHAMPIONS
 * ======================================================
 */

async function loadHomeChampions() {

    const container =
        document.getElementById(
            'home-champion-banners'
        );


    if (
        !container
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                '/api/history'
            );


        if (
            !response.ok
        ) {

            throw new Error(
                'Unable to retrieve league history.'
            );

        }


        const historyData =
            await response.json();


        const seasons =
            (
                historyData.seasons ||
                []
            )
                .filter(
                    season =>
                        season.champion
                )
                .sort(
                    (a, b) =>
                        Number(a.season) -
                        Number(b.season)
                );


        if (
            seasons.length ===
            0
        ) {

            container.innerHTML = `

                <div class="champions-loading">
                    No league champions yet.
                </div>

            `;

            return;

        }


        container.innerHTML =
            seasons
                .map(
                    seasonData => {

                        const champion =
                            seasonData.champion;


                        /*
                         * =====================================
                         * OWNER NAME
                         * =====================================
                         */

                        const fallbackOwner =
                            champion.owner ||
                            champion.username ||
                            'Unknown Manager';


                        const ownerName =
                            window.LEAGUE_DATA &&
                            typeof window.LEAGUE_DATA.getOwnerName ===
                                'function'
                                ? window.LEAGUE_DATA.getOwnerName(
                                    champion.owner_id,
                                    fallbackOwner
                                  )
                                : fallbackOwner;


                        /*
                         * =====================================
                         * TEAM NAME
                         * =====================================
                         */

                        const teamName =
                            champion.team_name ||
                            champion.team ||
                            'Unknown Team';


                        /*
                         * =====================================
                         * CHAMPION RECORD
                         * =====================================
                         *
                         * Find the champion inside that season's
                         * team data so we can display the record.
                         */

                        const championTeam =
                            (
                                seasonData.teams ||
                                []
                            )
                                .find(
                                    team =>
                                        String(
                                            team.owner_id
                                        ) ===
                                        String(
                                            champion.owner_id
                                        )
                                );


                        let record =
                            '—';


                        if (
                            championTeam
                        ) {

                            const wins =
                                Number(
                                    championTeam.wins ||
                                    0
                                );


                            const losses =
                                Number(
                                    championTeam.losses ||
                                    0
                                );


                            const ties =
                                Number(
                                    championTeam.ties ||
                                    0
                                );


                            record =
                                `${wins}-${losses}`;


                            if (
                                ties >
                                0
                            ) {

                                record +=
                                    `-${ties}`;

                            }

                        }


                        /*
                         * =====================================
                         * BUILD BANNER
                         * =====================================
                         */

                        return `

                            <div class="champion-banner">

                                <div class="banner-year">
                                    ${seasonData.season}
                                </div>


                                <div class="banner-champion">
                                    League Champion
                                </div>


                                <div class="banner-owner">
                                    ${ownerName}
                                </div>


                                <div class="banner-team">
                                    ${teamName}
                                </div>


                                <div class="banner-record">
                                    ${record}
                                </div>


                                <div class="banner-trophy">
                                    ★
                                </div>

                            </div>

                        `;

                    }
                )
                .join('');


    } catch (
        error
    ) {

        console.error(
            'Error loading home champions:',
            error
        );


        container.innerHTML = `

            <div class="champions-loading">
                Unable to load league champions.
            </div>

        `;

    }

}


loadHomeChampions();
