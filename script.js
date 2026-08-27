/*
 * ======================================================
 * HOME — CURRENT LEAGUE LOOKUP
 * ======================================================
 *
 * Uses the current NFL season to locate the current
 * A Game of Inches Sleeper league automatically.
 *
 * This avoids hard-coding a new league ID each season.
 * ======================================================
 */

async function getCurrentHomeLeague() {

    const leagueOwnerUserId =
        "978544154789699584";


    /*
     * Determine Sleeper's current NFL season.
     */

    const stateResponse =
        await fetch(
            'https://api.sleeper.app/v1/state/nfl'
        );


    if (
        !stateResponse.ok
    ) {

        throw new Error(
            'Unable to retrieve NFL state.'
        );

    }


    const nflState =
        await stateResponse.json();


    const season =
        String(
            nflState.season
        );


    /*
     * Find this user's leagues for the current season.
     */

    const leaguesResponse =
        await fetch(
            `https://api.sleeper.app/v1/user/${leagueOwnerUserId}/leagues/nfl/${season}`
        );


    if (
        !leaguesResponse.ok
    ) {

        throw new Error(
            'Unable to retrieve current Sleeper leagues.'
        );

    }


    const leagues =
        await leaguesResponse.json();


    /*
     * Locate A Game of Inches.
     */

    const league =
        leagues.find(
            item =>
                String(
                    item.name ||
                    ''
                )
                    .toLowerCase()
                    .includes(
                        'a game of inches'
                    )
        );


    if (
        !league
    ) {

        throw new Error(
            `Unable to find A Game of Inches for ${season}.`
        );

    }


    return league;

}



/*
 * ======================================================
 * HOME — DIVISION STANDINGS
 * ======================================================
 */

async function loadStandings() {

    const standingsContainer =
        document.getElementById(
            'home-division-standings'
        );


    if (
        !standingsContainer
    ) {

        return;

    }


    try {

        /*
         * ==================================================
         * CURRENT LEAGUE
         * ==================================================
         */

        const league =
            await getCurrentHomeLeague();


        const leagueId =
            league.league_id;


        /*
         * Update both season labels while we're here.
         */

        const homeSeasonLabel =
            document.getElementById(
                'home-season-label'
            );


        const seasonHeroTitle =
            document.getElementById(
                'season-hero-title'
            );


        if (
            homeSeasonLabel
        ) {

            homeSeasonLabel.textContent =
                `${league.season} Season`;

        }


        if (
            seasonHeroTitle
        ) {

            seasonHeroTitle.textContent =
                `${league.season} Season`;

        }


        /*
         * ==================================================
         * LOAD USERS + ROSTERS
         * ==================================================
         */

        const [
            usersResponse,
            rostersResponse
        ] = await Promise.all([

            fetch(
                `https://api.sleeper.app/v1/league/${leagueId}/users`
            ),

            fetch(
                `https://api.sleeper.app/v1/league/${leagueId}/rosters`
            )

        ]);


        if (
            !usersResponse.ok ||
            !rostersResponse.ok
        ) {

            throw new Error(
                'Unable to retrieve division standings.'
            );

        }


        const users =
            await usersResponse.json();


        const rosters =
            await rostersResponse.json();


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
         * BUILD TEAM DATA
         * ==================================================
         */

        const teams =
            rosters.map(
                roster => {

                    const user =
                        userMap[
                            roster.owner_id
                        ];


                    const settings =
                        roster.settings ||
                        {};


                    /*
                     * Sleeper stores PF as whole points
                     * plus a decimal component.
                     */

                    const pointsFor =
                        Number(
                            settings.fpts ||
                            0
                        ) +
                        (
                            Number(
                                settings.fpts_decimal ||
                                0
                            ) /
                            100
                        );


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


return {

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
        `Team ${roster.roster_id}`,

                        wins:
                            Number(
                                settings.wins ||
                                0
                            ),

                        losses:
                            Number(
                                settings.losses ||
                                0
                            ),

                        ties:
                            Number(
                                settings.ties ||
                                0
                            ),

                        points_for:
                            pointsFor,

                        division:
                            Number(
                                settings.division
                            )

                    };

                }
            );


        /*
         * ==================================================
         * STANDINGS SORT
         * ==================================================
         */

        const sortStandings =
            (
                a,
                b
            ) => {

                if (
                    b.wins !==
                    a.wins
                ) {

                    return (
                        b.wins -
                        a.wins
                    );

                }


                return (
                    b.points_for -
                    a.points_for
                );

            };


        /*
         * ==================================================
         * GROUP TEAMS BY DIVISION
         * ==================================================
         */

        const divisionGroups =
            {};


        teams.forEach(
            team => {

                const division =
                    Number.isFinite(
                        team.division
                    )
                        ? team.division
                        : 0;


                if (
                    !divisionGroups[
                        division
                    ]
                ) {

                    divisionGroups[
                        division
                    ] =
                        [];

                }


                divisionGroups[
                    division
                ].push(
                    team
                );

            }
        );


        /*
         * ==================================================
         * DIVISION WINNERS
         * ==================================================
         */

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
         * BYE TEAMS
         * ==================================================
         *
         * Top two division winners:
         * Record, then PF.
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
                                team.roster_id
                            )
                    )
            );


        const divisionWinnerIds =
            new Set(
                divisionWinners.map(
                    team =>
                        String(
                            team.roster_id
                        )
                )
            );


        /*
         * ==================================================
         * WILD CARDS
         * ==================================================
         *
         * Best three remaining teams across all divisions.
         */

        const wildCards =
            teams
                .filter(
                    team =>
                        !divisionWinnerIds.has(
                            String(
                                team.roster_id
                            )
                        )
                )
                .sort(
                    sortStandings
                )
                .slice(
                    0,
                    3
                );


        const wildCardIds =
            new Set(
                wildCards.map(
                    team =>
                        String(
                            team.roster_id
                        )
                )
            );


        /*
         * ==================================================
         * PLAYOFF LABEL
         * ==================================================
         */

        function getPlayoffStatus(
            team
        ) {

            const id =
                String(
                    team.roster_id
                );


            if (
                byeTeams.has(
                    id
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
                divisionWinnerIds.has(
                    id
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
                wildCardIds.has(
                    id
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
         * BUILD DIVISION CARDS
         * ==================================================
         */

        const divisionNumbers =
            Object.keys(
                divisionGroups
            )
                .map(
                    Number
                )
                .sort(
                    (a, b) =>
                        a - b
                );


        standingsContainer.innerHTML =
            divisionNumbers
                .map(
                    divisionNumber => {

                        const divisionTeams =
                            [
                                ...divisionGroups[
                                    divisionNumber
                                ]
                            ]
                                .sort(
                                    sortStandings
                                );


                        /*
                         * Sleeper commonly stores division
                         * names in league metadata.
                         *
                         * Fall back to Division 1, etc.
                         */

                        const divisionName =
                            league
                                ?.metadata
                                ?.[
                                    `division_${divisionNumber}`
                                ] ||
                            `Division ${divisionNumber}`;


                        const rows =
                            divisionTeams
                                .map(
                                    (
                                        team,
                                        index
                                    ) => {

                                        let record =
                                            `${team.wins}-${team.losses}`;


                                        if (
                                            team.ties >
                                            0
                                        ) {

                                            record +=
                                                `-${team.ties}`;

                                        }


                                        return `

                                            <tr>

                                                <td
                                                    class="
                                                        division-rank
                                                    "
                                                >
                                                    ${index + 1}
                                                </td>


                                            <td
    class="
        division-team-name
    "
>

    <strong>
        ${team.owner}
    </strong>

    <span>
        ${team.team_name}
    </span>

</td>

                                                <td>
                                                    ${record}
                                                </td>


                                                <td>
                                                    ${
                                                        team
                                                            .points_for
                                                            .toFixed(2)
                                                    }
                                                </td>


                                                <td>
                                                    ${
                                                        getPlayoffStatus(
                                                            team
                                                        )
                                                    }
                                                </td>

                                            </tr>

                                        `;

                                    }
                                )
                                .join('');


                        return `

                            <div
                                class="
                                    card
                                    division-standings-card
                                "
                            >

                                <div class="card-header">

                                    <h3>
                                        ${divisionName}
                                    </h3>

                                </div>


                                <div
                                    class="
                                        division-table-scroll
                                    "
                                >

                                    <table
                                        class="
                                            division-standings-table
                                        "
                                    >

                                        <thead>

                                            <tr>

                                                <th>
                                                    #
                                                </th>

                                                <th>
                                                    Team
                                                </th>

                                                <th>
                                                    Record
                                                </th>

                                                <th>
                                                    PF
                                                </th>

                                                <th>
                                                    Playoff Picture
                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            ${rows}

                                        </tbody>

                                    </table>

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
            'Error loading division standings:',
            error
        );


        standingsContainer.innerHTML = `

            <div class="card">

                <p class="placeholder-text">
                    Unable to load division standings.
                </p>

            </div>

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

/*
 * ======================================================
 * HOME — WEEKLY MATCHUPS
 * ======================================================
 *
 * Automatically loads the current A Game of Inches league,
 * determines the current fantasy week, and highlights one
 * matchup as the Game of the Week.
 *
 * GAME OF THE WEEK:
 *
 * 1. Highest combined wins
 * 2. Highest combined Points For as the tiebreaker
 *
 * ======================================================
 */

async function loadHomeMatchups() {

    const weekNumber =
        document.getElementById(
            'home-week-number'
        );


    const matchupsContainer =
        document.getElementById(
            'home-matchups'
        );


    if (
        !weekNumber ||
        !matchupsContainer
    ) {

        return;

    }


    try {

        /*
         * ==================================================
         * CURRENT LEAGUE
         * ==================================================
         */

        const league =
            await getCurrentHomeLeague();


        const leagueId =
            league.league_id;


        /*
         * ==================================================
         * LOAD SLEEPER DATA
         * ==================================================
         */

        const [
            stateResponse,
            usersResponse,
            rostersResponse
        ] = await Promise.all([

            fetch(
                'https://api.sleeper.app/v1/state/nfl'
            ),

            fetch(
                `https://api.sleeper.app/v1/league/${leagueId}/users`
            ),

            fetch(
                `https://api.sleeper.app/v1/league/${leagueId}/rosters`
            )

        ]);


        if (
            !stateResponse.ok ||
            !usersResponse.ok ||
            !rostersResponse.ok
        ) {

            throw new Error(
                'Unable to load matchup data.'
            );

        }


        const nflState =
            await stateResponse.json();


        const users =
            await usersResponse.json();


        const rosters =
            await rostersResponse.json();


        /*
         * ==================================================
         * DETERMINE CURRENT FANTASY WEEK
         * ==================================================
         *
         * Sleeper's NFL week can advance during preseason.
         * Until the regular season begins, we display Week 1.
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


        if (
            currentWeek < 1
        ) {

            currentWeek =
                1;

        }


        /*
         * ==================================================
         * LOAD CURRENT WEEK MATCHUPS
         * ==================================================
         */

        const matchupsResponse =
            await fetch(
                `https://api.sleeper.app/v1/league/${leagueId}/matchups/${currentWeek}`
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


                if (
                    user
                        ?.metadata
                        ?.avatar
                ) {

                    avatarUrl =
                        user.metadata.avatar;

                }


                /*
                 * Current standings information.
                 *
                 * This is what we use to choose the
                 * Game of the Week.
                 */

                const settings =
                    roster.settings ||
                    {};


                const wins =
                    Number(
                        settings.wins ||
                        0
                    );


                const pointsFor =
                    Number(
                        settings.fpts ||
                        0
                    ) +
                    (
                        Number(
                            settings.fpts_decimal ||
                            0
                        ) /
                        100
                    );


                rosterMap[
                    roster.roster_id
                ] = {

                    roster_id:
                        roster.roster_id,

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
                        `Team ${roster.roster_id}`,

                    wins:
                        wins,

                    points_for:
                        pointsFor

                };

            }
        );


        /*
         * ==================================================
         * GROUP MATCHUPS
         * ==================================================
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


        /*
         * Only keep complete two-team matchup groups.
         */

        const validMatchups =
            Object.values(
                matchupGroups
            )
                .filter(
                    matchup =>
                        matchup.length ===
                        2
                );


        /*
         * ==================================================
         * GAME OF THE WEEK
         * ==================================================
         *
         * Rank each matchup by:
         *
         * 1. Combined wins
         * 2. Combined PF
         *
         * The matchup with the strongest combined standing
         * becomes Game of the Week.
         */

        let gameOfWeekIndex =
            -1;


        let bestCombinedWins =
            -1;


        let bestCombinedPF =
            -1;


        validMatchups.forEach(
            (
                matchup,
                index
            ) => {

                const firstTeam =
                    rosterMap[
                        matchup[0].roster_id
                    ];


                const secondTeam =
                    rosterMap[
                        matchup[1].roster_id
                    ];


                if (
                    !firstTeam ||
                    !secondTeam
                ) {

                    return;

                }


                const combinedWins =
                    firstTeam.wins +
                    secondTeam.wins;


                const combinedPF =
                    firstTeam.points_for +
                    secondTeam.points_for;


                if (
                    combinedWins >
                    bestCombinedWins
                ) {

                    bestCombinedWins =
                        combinedWins;

                    bestCombinedPF =
                        combinedPF;

                    gameOfWeekIndex =
                        index;

                    return;

                }


                if (
                    combinedWins ===
                        bestCombinedWins &&
                    combinedPF >
                        bestCombinedPF
                ) {

                    bestCombinedPF =
                        combinedPF;

                    gameOfWeekIndex =
                        index;

                }

            }
        );


        /*
         * ==================================================
         * WEEK LABEL
         * ==================================================
         */

        weekNumber.textContent =
            `Week ${currentWeek}`;


        /*
         * ==================================================
         * BUILD MATCHUP CARDS
         * ==================================================
         */

        const matchupCards =
            validMatchups
                .map(
                    (
                        matchup,
                        index
                    ) => {

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


                        const isGameOfWeek =
                            index ===
                            gameOfWeekIndex;


                        const gameOfWeekBanner =
                            isGameOfWeek
                                ? `

                                    <div class="game-of-week-label">
                                        ★ Game of the Week ★
                                    </div>

                                  `
                                : '';


                        return `

                            <div
                                class="
                                    home-matchup-card
                                    ${
                                        isGameOfWeek
                                            ? 'game-of-week'
                                            : ''
                                    }
                                "
                            >

                                ${gameOfWeekBanner}


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


        weekNumber.textContent =
            'This Week';


        matchupsContainer.innerHTML = `

            <div class="matchup-placeholder">

                Unable to load weekly matchups.

            </div>

        `;

    }

}


loadHomeMatchups();

/*
 * ======================================================
 * HOME — TRADES / WAIVER WIRE
 * ======================================================
 */

async function loadHomeTransactions() {

    const tradesContainer =
        document.getElementById(
            'home-trades'
        );

    const waiversContainer =
        document.getElementById(
            'home-waivers'
        );


    if (
        !tradesContainer ||
        !waiversContainer
    ) {
        return;
    }


    try {

        const league =
            await getCurrentHomeLeague();

        const leagueId =
            league.league_id;


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
                'Unable to retrieve league activity.'
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
         * USER LOOKUP
         */

        const userMap = {};


        users.forEach(
            user => {

                userMap[user.user_id] =
                    user;

            }
        );


        /*
         * ROSTER LOOKUP
         */

        const rosterMap = {};


        rosters.forEach(
            roster => {

                const user =
                    userMap[
                        roster.owner_id
                    ];


                const sleeperUsername =
                    user?.display_name ||
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
         * CURRENT TRANSACTION WEEK
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


        if (
            currentWeek < 1
        ) {

            currentWeek =
                1;

        }


        /*
         * LOAD RECENT TRANSACTIONS
         */

        const allTransactions = [];


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


            const transactions =
                await response.json();


            transactions.forEach(
                transaction => {

                    allTransactions.push(
                        {
                            ...transaction,
                            week
                        }
                    );

                }
            );

        }


        allTransactions.sort(
            (a, b) =>
                Number(b.created || 0) -
                Number(a.created || 0)
        );


        /*
         * HELPERS
         */

        function getPlayerName(
            playerId
        ) {

            const player =
                players[playerId];


            if (!player) {
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

            return (
                rosterMap[rosterId] ||
                {
                    owner:
                        'Unknown Manager',

                    team_name:
                        'Unknown Team'
                }
            );

        }


        /*
         * TRADE DISPLAY
         */

        function buildTradeHTML(
            transaction
        ) {

            const rosterIds =
                transaction.roster_ids ||
                [];

            const adds =
                transaction.adds ||
                {};

            const draftPicks =
                transaction.draft_picks ||
                [];


            const sides =
                rosterIds
                    .map(
                        rosterId => {

                            const roster =
                                getRoster(
                                    rosterId
                                );


                            const receivedPlayers =
                                Object.entries(
                                    adds
                                )
                                    .filter(
                                        (
                                            [
                                                playerId,
                                                receivingRosterId
                                            ]
                                        ) =>
                                            Number(
                                                receivingRosterId
                                            ) ===
                                            Number(
                                                rosterId
                                            )
                                    )
                                    .map(
                                        ([playerId]) =>
                                            getPlayerName(
                                                playerId
                                            )
                                    );


                            const receivedPicks =
                                draftPicks
                                    .filter(
                                        pick =>
                                            Number(
                                                pick.roster_id
                                            ) ===
                                            Number(
                                                rosterId
                                            )
                                    )
                                    .map(
                                        pick =>
                                            `${pick.season} Round ${pick.round} Pick`
                                    );


                            const assets =
                                [
                                    ...receivedPlayers,
                                    ...receivedPicks
                                ];


                            return `

                                <div class="home-trade-side">

                                    <div class="home-trade-team">

                                        <strong>
                                            ${roster.owner}
                                        </strong>

                                        <span>
                                            ${roster.team_name}
                                        </span>

                                    </div>


                                    <div class="home-trade-received">

                                        <small>
                                            Receives
                                        </small>

                                        ${
                                            assets.length
                                                ? assets
                                                    .map(
                                                        asset => `
                                                            <div class="home-trade-asset">
                                                                ${asset}
                                                            </div>
                                                        `
                                                    )
                                                    .join('')
                                                : `
                                                    <div class="home-trade-asset">
                                                        —
                                                    </div>
                                                  `
                                        }

                                    </div>

                                </div>

                            `;

                        }
                    )
                    .join(
                        `
                            <div class="home-trade-arrow">
                                ⇄
                            </div>
                        `
                    );


            return `

                <div class="
                    home-transaction-item
                    home-trade-item
                ">

                    <div class="home-transaction-main">

                        <div class="home-trade-layout">
                            ${sides}
                        </div>

                        <div class="home-transaction-meta">
                            Week ${transaction.week}
                        </div>

                    </div>

                </div>

            `;

        }


        /*
         * WAIVER / FREE AGENT DISPLAY
         */

        function buildWaiverHTML(
            transaction
        ) {

            const adds =
                transaction.adds ||
                {};

            const drops =
                transaction.drops ||
                {};


            const involvedRosterIds =
                new Set([
                    ...Object.values(adds),
                    ...Object.values(drops)
                ]);


            const rosterId =
                [...involvedRosterIds][0];


            const roster =
                getRoster(
                    rosterId
                );


            const addedPlayers =
                Object.keys(adds)
                    .map(
                        getPlayerName
                    );


            const droppedPlayers =
                Object.keys(drops)
                    .map(
                        getPlayerName
                    );


            const label =
                transaction.type ===
                    'waiver'
                    ? 'Waiver'
                    : 'Free Agent';


            const faabBid =
                Number(
                    transaction
                        ?.settings
                        ?.waiver_bid ||
                    0
                );


            return `

                <div class="home-transaction-item">

                    <div class="home-transaction-type">
                        ${label}
                    </div>


                    <div class="home-transaction-main">

                        <div class="home-transaction-team">

                            <strong>
                                ${roster.owner}
                            </strong>

                            <span>
                                ${roster.team_name}
                            </span>

                        </div>


                        ${
                            addedPlayers.length
                                ? `
                                    <div class="
                                        home-transaction-action
                                        add
                                    ">

                                        <span>
                                            Added
                                        </span>

                                        <strong>
                                            ${addedPlayers.join(', ')}
                                        </strong>

                                    </div>
                                  `
                                : ''
                        }


                        ${
                            droppedPlayers.length
                                ? `
                                    <div class="
                                        home-transaction-action
                                        drop
                                    ">

                                        <span>
                                            Dropped
                                        </span>

                                        <strong>
                                            ${droppedPlayers.join(', ')}
                                        </strong>

                                    </div>
                                  `
                                : ''
                        }


                        ${
                            transaction.type ===
                                'waiver'
                                ? `
                                    <div class="home-waiver-faab">

                                        FAAB:
                                        <strong>
                                            $${faabBid}
                                        </strong>

                                    </div>
                                  `
                                : ''
                        }


                        <div class="home-transaction-meta">
                            Week ${transaction.week}
                        </div>

                    </div>

                </div>

            `;

        }


        /*
         * TRADES ONLY
         */

        const recentTrades =
            allTransactions
                .filter(
                    transaction =>
                        transaction.status ===
                            'complete' &&
                        transaction.type ===
                            'trade'
                )
                .slice(
                    0,
                    5
                );


        tradesContainer.innerHTML =
            recentTrades.length
                ? recentTrades
                    .map(
                        buildTradeHTML
                    )
                    .join('')
                : `
                    <p class="placeholder-text">
                        No recent trades.
                    </p>
                  `;


        /*
         * WAIVERS + FREE AGENTS
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


        waiversContainer.innerHTML =
            recentWaivers.length
                ? recentWaivers
                    .map(
                        buildWaiverHTML
                    )
                    .join('')
                : `
                    <p class="placeholder-text">
                        No recent waiver or free-agent activity.
                    </p>
                  `;


    } catch (
        error
    ) {

        console.error(
            'Error loading league activity:',
            error
        );


        tradesContainer.innerHTML = `

            <p class="placeholder-text">
                Unable to load recent trades.
            </p>

        `;


        waiversContainer.innerHTML = `

            <p class="placeholder-text">
                Unable to load waiver activity.
            </p>

        `;

    }

}


loadHomeTransactions();

/*
 * ======================================================
 * HOME — WAIVER COUNTDOWN
 * ======================================================
 *
 * Waivers clear every Wednesday at 3:00 AM Eastern.
 *
 * During the offseason / preseason, the countdown is
 * disabled and displays "Begins Week 1".
 * ======================================================
 */

async function startHomeWaiverCountdown() {

    const countdown =
        document.getElementById(
            'home-waiver-countdown'
        );


    if (
        !countdown
    ) {

        return;

    }


    /*
     * ==================================================
     * CHECK NFL SEASON STATUS
     * ==================================================
     */

    try {

        const stateResponse =
            await fetch(
                'https://api.sleeper.app/v1/state/nfl'
            );


        if (
            stateResponse.ok
        ) {

            const nflState =
                await stateResponse.json();


            /*
             * Do not run the countdown until the
             * NFL regular season begins.
             */

            if (
                nflState.season_type !==
                'regular'
            ) {

                countdown.textContent =
                    'Begins Week 1';

                countdown.classList.add(
                    'waiver-countdown-inactive'
                );

                return;

            }

        }

    } catch (
        error
    ) {

        console.error(
            'Unable to determine waiver countdown season status:',
            error
        );

        /*
         * If Sleeper state cannot be loaded, continue
         * with the countdown rather than breaking the page.
         */

    }


    /*
     * ==================================================
     * WAIVER COUNTDOWN
     * ==================================================
     */

    const timeZone =
        'America/New_York';


    /*
     * Get the UTC offset for Eastern Time.
     */

    function getEasternOffsetMinutes(
        date
    ) {

        const formatter =
            new Intl.DateTimeFormat(
                'en-US',
                {
                    timeZone:
                        timeZone,

                    timeZoneName:
                        'shortOffset'
                }
            );


        const parts =
            formatter.formatToParts(
                date
            );


        const zonePart =
            parts.find(
                part =>
                    part.type ===
                    'timeZoneName'
            );


        const match =
            zonePart
                ?.value
                ?.match(
                    /GMT([+-])(\d{1,2})(?::(\d{2}))?/
                );


        if (
            !match
        ) {

            return -300;

        }


        const sign =
            match[1] ===
                '+'
                ? 1
                : -1;


        const hours =
            Number(
                match[2] ||
                0
            );


        const minutes =
            Number(
                match[3] ||
                0
            );


        return (
            sign *
            (
                hours *
                60 +
                minutes
            )
        );

    }


    /*
     * Convert an Eastern local date/time to UTC.
     */

    function easternDateToUTC(
        year,
        month,
        day,
        hour,
        minute
    ) {

        let candidate =
            new Date(
                Date.UTC(
                    year,
                    month - 1,
                    day,
                    hour,
                    minute,
                    0
                )
            );


        const offset =
            getEasternOffsetMinutes(
                candidate
            );


        candidate =
            new Date(
                candidate.getTime() -
                offset *
                60 *
                1000
            );


        return candidate;

    }


    /*
     * Read calendar information in Eastern Time.
     */

    function getEasternParts(
        date
    ) {

        const formatter =
            new Intl.DateTimeFormat(
                'en-US',
                {
                    timeZone:
                        timeZone,

                    year:
                        'numeric',

                    month:
                        'numeric',

                    day:
                        'numeric',

                    weekday:
                        'short',

                    hour:
                        'numeric',

                    minute:
                        'numeric',

                    second:
                        'numeric',

                    hourCycle:
                        'h23'
                }
            );


        const parts =
            formatter.formatToParts(
                date
            );


        const values =
            {};


        parts.forEach(
            part => {

                if (
                    part.type !==
                    'literal'
                ) {

                    values[
                        part.type
                    ] =
                        part.value;

                }

            }
        );


        return {

            year:
                Number(
                    values.year
                ),

            month:
                Number(
                    values.month
                ),

            day:
                Number(
                    values.day
                ),

            weekday:
                values.weekday,

            hour:
                Number(
                    values.hour
                )

        };

    }


    /*
     * Find the next Wednesday at 3:00 AM Eastern.
     */

    function getNextWaiverTime() {

        const now =
            new Date();


        const eastern =
            getEasternParts(
                now
            );


        const weekdayNumbers =
            {
                Sun: 0,
                Mon: 1,
                Tue: 2,
                Wed: 3,
                Thu: 4,
                Fri: 5,
                Sat: 6
            };


        const currentDay =
            weekdayNumbers[
                eastern.weekday
            ];


        let daysUntilWednesday =
            (
                3 -
                currentDay +
                7
            ) %
            7;


        /*
         * If it is already Wednesday after 3 AM,
         * move to next Wednesday.
         */

        if (
            daysUntilWednesday ===
                0 &&
            eastern.hour >=
                3
        ) {

            daysUntilWednesday =
                7;

        }


        /*
         * Use noon as the starting point to avoid
         * daylight-saving rollover problems.
         */

        const todayNoon =
            easternDateToUTC(
                eastern.year,
                eastern.month,
                eastern.day,
                12,
                0
            );


        const targetDate =
            new Date(
                todayNoon.getTime() +
                daysUntilWednesday *
                24 *
                60 *
                60 *
                1000
            );


        const targetParts =
            getEasternParts(
                targetDate
            );


        return easternDateToUTC(
            targetParts.year,
            targetParts.month,
            targetParts.day,
            3,
            0
        );

    }


    /*
     * Update the visible countdown.
     */

    function updateCountdown() {

        const now =
            new Date();


        const nextWaiver =
            getNextWaiverTime();


        let difference =
            nextWaiver.getTime() -
            now.getTime();


        if (
            difference <
            0
        ) {

            difference =
                0;

        }


        const totalMinutes =
            Math.floor(
                difference /
                60000
            );


        const days =
            Math.floor(
                totalMinutes /
                1440
            );


        const hours =
            Math.floor(
                (
                    totalMinutes %
                    1440
                ) /
                60
            );


        const minutes =
            totalMinutes %
            60;


        countdown.textContent =
            `${days}d ${hours}h ${minutes}m`;

    }


    updateCountdown();


    /*
     * Refresh every 30 seconds.
     */

    setInterval(
        updateCountdown,
        30000
    );

}


startHomeWaiverCountdown();

/*
 * ======================================================
 * HOME — LEAGUE CHAMPIONS
 * ======================================================
 *
 * Champions are determined automatically from Sleeper's
 * winners bracket.
 *
 * The p === 1 matchup is the championship game.
 * The roster stored in "w" is the league champion.
 *
 * Starting with the current league, previous_league_id
 * is followed backwards so future seasons do not need
 * to be manually added.
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

        const currentLeagueId =
            "1312098239821914112";


        /*
         * Load our historical team data.
         */

        const historyResponse =
            await fetch(
                '/api/history'
            );


        if (
            !historyResponse.ok
        ) {

            throw new Error(
                'Unable to retrieve league history.'
            );

        }


        const historyData =
            await historyResponse.json();


        /*
         * ==================================================
         * BUILD SLEEPER LEAGUE HISTORY
         * ==================================================
         *
         * Sleeper links each dynasty season to the
         * previous season through previous_league_id.
         */

        const leagueHistory =
            [];


        let leagueId =
            currentLeagueId;


        const visitedLeagueIds =
            new Set();


        while (
            leagueId &&
            leagueId !== '0' &&
            !visitedLeagueIds.has(
                leagueId
            )
        ) {

            visitedLeagueIds.add(
                leagueId
            );


            const leagueResponse =
                await fetch(
                    `https://api.sleeper.app/v1/league/${leagueId}`
                );


            if (
                !leagueResponse.ok
            ) {

                break;

            }


            const league =
                await leagueResponse.json();


            leagueHistory.push(
                {
                    league_id:
                        leagueId,

                    season:
                        Number(
                            league.season
                        )
                }
            );


            leagueId =
                league.previous_league_id;

        }


        /*
         * ==================================================
         * FIND EACH CHAMPION
         * ==================================================
         */

        const champions =
            [];


        for (
            const leagueSeason
            of leagueHistory
        ) {

            const bracketResponse =
                await fetch(
                    `https://api.sleeper.app/v1/league/${leagueSeason.league_id}/winners_bracket`
                );


            if (
                !bracketResponse.ok
            ) {

                continue;

            }


            const bracket =
                await bracketResponse.json();


            /*
             * p === 1 is the league championship game.
             */

            const championshipGame =
                bracket.find(
                    game =>
                        game.p === 1
                );


            /*
             * Current/incomplete seasons will not have a
             * completed championship winner yet.
             */

            if (
                !championshipGame ||
                !championshipGame.w
            ) {

                continue;

            }


            /*
             * Find this season inside /api/history.
             */

            const seasonData =
                (
                    historyData.seasons ||
                    []
                )
                    .find(
                        season =>
                            Number(
                                season.season
                            ) ===
                            leagueSeason.season
                    );


            if (
                !seasonData
            ) {

                continue;

            }


            /*
             * Match the winning roster ID to its historical
             * team and owner.
             */

            const championTeam =
                (
                    seasonData.teams ||
                    []
                )
                    .find(
                        team =>
                            Number(
                                team.roster_id
                            ) ===
                            Number(
                                championshipGame.w
                            )
                    );


            if (
                !championTeam
            ) {

                continue;

            }


            /*
             * Real owner name from league-data.js.
             */

            const fallbackOwner =
                championTeam.owner ||
                'Unknown Manager';


            const ownerName =
                window.LEAGUE_DATA &&
                typeof window.LEAGUE_DATA.getOwnerName ===
                    'function'
                    ? window.LEAGUE_DATA.getOwnerName(
                        championTeam.owner_id,
                        fallbackOwner
                      )
                    : fallbackOwner;


            /*
             * Regular-season record.
             */

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


            let record =
                `${wins}-${losses}`;


            if (
                ties >
                0
            ) {

                record +=
                    `-${ties}`;

            }


            champions.push(
                {

                    season:
                        leagueSeason.season,

                    owner:
                        ownerName,

                    team_name:
                        championTeam.team_name ||
                        fallbackOwner,

                    record:
                        record

                }
            );

        }


        /*
         * Oldest champion first.
         */

        champions.sort(
            (a, b) =>
                a.season -
                b.season
        );


        if (
            champions.length ===
            0
        ) {

            container.innerHTML = `

                <div class="champions-loading">
                    No league champions yet.
                </div>

            `;

            return;

        }


        /*
         * ==================================================
         * BUILD CHAMPIONSHIP BANNERS
         * ==================================================
         */

        container.innerHTML =
            champions
                .map(
                    champion => `

                        <div class="champion-banner">

                            <div class="banner-year">
                                ${champion.season}
                            </div>


                            <div class="banner-champion">
                                League Champion
                            </div>


                            <div class="banner-owner">
                                ${champion.owner}
                            </div>


                            <div class="banner-team">
                                ${champion.team_name}
                            </div>


                            <div class="banner-record">
                                ${champion.record}
                            </div>


                            <div class="banner-trophy">
                                ★
                            </div>

                        </div>

                    `
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
