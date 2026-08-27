/*
 * ======================================================
 * STANDINGS PAGE
 * ======================================================
 */

async function loadStandingsPage() {

    const standingsBody =
        document.getElementById(
            'standings-page-body'
        );


    const headToHeadTable =
        document.getElementById(
            'head-to-head-table'
        );


    const seasonTitle =
        document.getElementById(
            'standings-season-title'
        );


    try {

        /*
         * =====================================================
         * CURRENT SEASON
         * =====================================================
         */

        const currentSeason =
            new Date().getFullYear();


        if (
            seasonTitle
        ) {

            seasonTitle.textContent =
                `${currentSeason} Standings`;

        }


        /*
         * =====================================================
         * LOAD CURRENT TEAMS + HISTORICAL MATCHUPS
         * =====================================================
         */

        const seasons =
            [];


        for (
            let season = 2023;
            season <= currentSeason;
            season++
        ) {

            seasons.push(
                season
            );

        }


        const [
            teamsResponse,
            ...matchupResponses
        ] = await Promise.all([

            fetch(
                '/api/teams'
            ),

            ...seasons.map(
                season =>
                    fetch(
                        `/api/matchup-history?season=${season}`
                    )
            )

        ]);


        if (
            !teamsResponse.ok
        ) {

            throw new Error(
                'Unable to retrieve standings.'
            );

        }


        const teamsData =
            await teamsResponse.json();


        if (
            !teamsData.teams
        ) {

            throw new Error(
                'No teams returned.'
            );

        }


        /*
         * Historical matchup endpoints may not have data
         * yet for the current/incomplete season.
         */

        const matchupData =
            [];


        for (
            let index = 0;
            index < matchupResponses.length;
            index++
        ) {

            const response =
                matchupResponses[
                    index
                ];


            if (
                !response.ok
            ) {

                continue;

            }


            matchupData.push(
                await response.json()
            );

        }


        /*
         * =====================================================
         * NORMALIZE CURRENT TEAMS
         * =====================================================
         */

        const teams =
            teamsData.teams.map(
                team => {

                    const fallbackOwner =
                        team.owner ||
                        'Unknown Manager';


                    const ownerName =
                        window.LEAGUE_DATA &&
                        typeof window.LEAGUE_DATA.getOwnerName ===
                            'function'
                            ? window.LEAGUE_DATA.getOwnerName(
                                team.owner_id,
                                fallbackOwner
                              )
                            : fallbackOwner;


                    return {

                        ...team,

                        owner:
                            ownerName,

                        wins:
                            Number(
                                team.wins ||
                                0
                            ),

                        losses:
                            Number(
                                team.losses ||
                                0
                            ),

                        ties:
                            Number(
                                team.ties ||
                                0
                            ),

                        points_for:
                            Number(
                                team.points_for ||
                                0
                            )

                    };

                }
            );


        /*
         * =====================================================
         * DEFAULT STANDINGS SORT
         * =====================================================
         */

        function standingsSort(
            a,
            b
        ) {

            if (
                b.wins !==
                a.wins
            ) {

                return (
                    b.wins -
                    a.wins
                );

            }


            if (
                a.losses !==
                b.losses
            ) {

                return (
                    a.losses -
                    b.losses
                );

            }


            return (
                b.points_for -
                a.points_for
            );

        }


        /*
         * =====================================================
         * PLAYOFF PICTURE
         * =====================================================
         */

        const divisionGroups =
            {};


        teams.forEach(
            team => {

                const division =
                    team.division ||
                    'No Division';


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
         * Projected division winners.
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
                                standingsSort
                            )[0]
                )
                .filter(
                    Boolean
                );


        /*
         * Top two division winners receive byes.
         */

        const rankedDivisionWinners =
            [
                ...divisionWinners
            ]
                .sort(
                    standingsSort
                );


        const byeIds =
            new Set(
                rankedDivisionWinners
                    .slice(
                        0,
                        2
                    )
                    .map(
                        team =>
                            String(
                                team.owner_id
                            )
                    )
            );


        const divisionWinnerIds =
            new Set(
                divisionWinners.map(
                    team =>
                        String(
                            team.owner_id
                        )
                )
            );


        /*
         * Three best remaining teams are Wild Cards.
         */

        const wildCards =
            teams
                .filter(
                    team =>
                        !divisionWinnerIds.has(
                            String(
                                team.owner_id
                            )
                        )
                )
                .sort(
                    standingsSort
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
                            team.owner_id
                        )
                )
            );


        /*
         * =====================================================
         * TOILET BOWL BYES
         * =====================================================
         *
         * The bottom two teams in the overall regular-season
         * standings receive a first-round Toilet Bowl bye.
         */

        const toiletBowlByeIds =
            new Set(
                [
                    ...teams
                ]
                    .sort(
                        standingsSort
                    )
                    .slice(
                        -2
                    )
                    .map(
                        team =>
                            String(
                                team.roster_id
                            )
                    )
            );


        /*
         * =====================================================
         * PLAYOFF STATUS
         * =====================================================
         */

        function getPlayoffStatus(
            team
        ) {

            const id =
                String(
                    team.owner_id
                );


            const rosterId =
                String(
                    team.roster_id
                );


            if (
                byeIds.has(
                    id
                )
            ) {

                return {
                    label:
                        'Division Winner • Bye',

                    order:
                        1,

                    className:
                        'playoff-bye'
                };

            }


            if (
                divisionWinnerIds.has(
                    id
                )
            ) {

                return {
                    label:
                        'Division Winner',

                    order:
                        2,

                    className:
                        'playoff-division'
                };

            }


            if (
                wildCardIds.has(
                    id
                )
            ) {

                return {
                    label:
                        'Wild Card',

                    order:
                        3,

                    className:
                        'playoff-wildcard'
                };

            }


            if (
                toiletBowlByeIds.has(
                    rosterId
                )
            ) {

                return {
                    label:
                        'Toilet Bowl • Bye',

                    order:
                        4,

                    className:
                        'playoff-toilet-bye'
                };

            }


            return {
                label:
                    'Toilet Bowl',

                order:
                    5,

                className:
                    'playoff-toilet'
            };

        }


        teams.forEach(
            team => {

                team.playoff =
                    getPlayoffStatus(
                        team
                    );

            }
        );


        /*
         * =====================================================
         * TABLE RENDERING
         * =====================================================
         */

        /*
         * Assign each team its true standings rank.
         * This rank remains attached to the team
         * even when the table is sorted by another column.
         */

        const officialStandings =
            [
                ...teams
            ]
                .sort(
                    standingsSort
                );


        officialStandings.forEach(
            (team, index) => {

                team.officialRank =
                    index + 1;

            }
        );


        let displayedTeams =
            [
                ...officialStandings
            ];


        let currentSort =
            {
                column:
                    'rank',

                direction:
                    'asc'
            };


        function renderStandings() {

            standingsBody.innerHTML =
                '';


            displayedTeams.forEach(
                (
                    team,
                    index
                ) => {

                    const record =
                        formatRecord(
                            team.wins,
                            team.losses,
                            team.ties
                        );


                    const row =
                        document.createElement(
                            'tr'
                        );


                    row.innerHTML = `

                        <td class="standing-rank">
                            ${formatRank(team.officialRank)}
                        </td>

                        <td class="standings-team-name">
                            ${team.team_name}
                        </td>

                        <td class="standings-owner-name">
                            ${team.owner}
                        </td>

                        <td>
                            ${team.division || '—'}
                        </td>

                        <td>
                            ${record}
                        </td>

                        <td>
                            ${team.points_for.toFixed(2)}
                        </td>

                        <td>

                            <span
                                class="
                                    playoff-badge
                                    ${team.playoff.className}
                                "
                            >
                                ${team.playoff.label}
                            </span>

                        </td>

                    `;


                    standingsBody.appendChild(
                        row
                    );

                }
            );

        }


        renderStandings();


        /*
         * =====================================================
         * SORTABLE COLUMNS
         * =====================================================
         */

        const sortableHeaders =
            document.querySelectorAll(
                '.standings-page-table th[data-sort]'
            );


        sortableHeaders.forEach(
            header => {

                header.classList.add(
                    'sortable-column'
                );


                header.addEventListener(
                    'click',
                    () => {

                        const column =
                            header.dataset.sort;


                        if (
                            currentSort.column ===
                            column
                        ) {

                            currentSort.direction =
                                currentSort.direction ===
                                    'asc'
                                    ? 'desc'
                                    : 'asc';

                        }

                        else {

                            currentSort.column =
                                column;

                            currentSort.direction =
                                column ===
                                    'pf'
                                    ? 'desc'
                                    : 'asc';

                        }


                        /*
                         * Rank resets to official standings.
                         */

                        if (
                            column ===
                            'rank'
                        ) {

                            displayedTeams =
                                [
                                    ...teams
                                ]
                                    .sort(
                                        standingsSort
                                    );


                            if (
                                currentSort.direction ===
                                'desc'
                            ) {

                                displayedTeams.reverse();

                            }

                        }

                        else {

                            displayedTeams =
                                [
                                    ...teams
                                ];


                            displayedTeams.sort(
                                (
                                    a,
                                    b
                                ) => {

                                    let result =
                                        0;


                                    if (
                                        column ===
                                        'team'
                                    ) {

                                        result =
                                            a.team_name.localeCompare(
                                                b.team_name
                                            );

                                    }


                                    else if (
                                        column ===
                                        'owner'
                                    ) {

                                        result =
                                            a.owner.localeCompare(
                                                b.owner
                                            );

                                    }


                                    else if (
                                        column ===
                                        'division'
                                    ) {

                                        result =
                                            String(
                                                a.division ||
                                                ''
                                            )
                                                .localeCompare(
                                                    String(
                                                        b.division ||
                                                        ''
                                                    )
                                                );

                                    }


                                    else if (
                                        column ===
                                        'record'
                                    ) {

                                        result =
                                            standingsSort(
                                                a,
                                                b
                                            );

                                    }


                                    else if (
                                        column ===
                                        'pf'
                                    ) {

                                        result =
                                            a.points_for -
                                            b.points_for;

                                    }


                                    else if (
                                        column ===
                                        'playoff'
                                    ) {

                                        result =
                                            a.playoff.order -
                                            b.playoff.order;

                                    }


                                    return (
                                        currentSort.direction ===
                                            'asc'
                                            ? result
                                            : -result
                                    );

                                }
                            );

                        }


                        /*
                         * Update arrows.
                         */

                        sortableHeaders.forEach(
                            item => {

                                item.classList.remove(
                                    'sort-asc',
                                    'sort-desc'
                                );

                            }
                        );


                        header.classList.add(
                            currentSort.direction ===
                                'asc'
                                ? 'sort-asc'
                                : 'sort-desc'
                        );


                        renderStandings();

                    }
                );

            }
        );


        /*
         * =====================================================
         * CURRENT MANAGER LOOKUP
         * =====================================================
         */

        const currentManagers =
            teams
                .map(
                    team => ({

                        owner_id:
                            team.owner_id,

                        owner:
                            team.owner,

                        team_name:
                            team.team_name

                    })
                )
                .sort(
                    (a, b) =>
                        a.owner.localeCompare(
                            b.owner
                        )
                );


        const currentOwnerIds =
            new Set(
                currentManagers.map(
                    manager =>
                        manager.owner_id
                )
            );


        /*
         * =====================================================
         * HEAD-TO-HEAD MAP
         * =====================================================
         */

        const headToHead =
            {};


        currentManagers.forEach(
            manager => {

                headToHead[
                    manager.owner_id
                ] =
                    {};

            }
        );


        matchupData.forEach(
            seasonData => {

                if (
                    !seasonData.games
                ) {

                    return;

                }


                seasonData.games.forEach(
                    game => {

                        /*
                         * Count regular season and championship
                         * bracket playoff games.
                         *
                         * Exclude consolation / placement games.
                         */

                        if (
                            game.playoff &&
                            !game.championship_playoff
                        ) {

                            return;

                        }


                        const first =
                            game.team_1;


                        const second =
                            game.team_2;


                        if (
                            !first ||
                            !second
                        ) {

                            return;

                        }


                        if (
                            !currentOwnerIds.has(
                                first.owner_id
                            ) ||
                            !currentOwnerIds.has(
                                second.owner_id
                            )
                        ) {

                            return;

                        }


                        ensureSeries(
                            headToHead,
                            first.owner_id,
                            second.owner_id
                        );


                        ensureSeries(
                            headToHead,
                            second.owner_id,
                            first.owner_id
                        );


                        const firstSeries =
                            headToHead[
                                first.owner_id
                            ][
                                second.owner_id
                            ];


                        const secondSeries =
                            headToHead[
                                second.owner_id
                            ][
                                first.owner_id
                            ];


                        firstSeries.points_for +=
                            first.points;

                        firstSeries.points_against +=
                            second.points;


                        secondSeries.points_for +=
                            second.points;

                        secondSeries.points_against +=
                            first.points;


                        if (
                            first.points >
                            second.points
                        ) {

                            firstSeries.wins++;
                            secondSeries.losses++;

                        }


                        else if (
                            second.points >
                            first.points
                        ) {

                            secondSeries.wins++;
                            firstSeries.losses++;

                        }


                        else {

                            /*
                             * Preserve your current rule:
                             * tied scores are ignored.
                             */

                            return;

                        }


                        const meeting =
                            {

                                season:
                                    game.season,

                                week:
                                    game.week,

                                first_score:
                                    first.points,

                                second_score:
                                    second.points

                            };


                        firstSeries.latest =
                            meeting;

                        secondSeries.latest =
                            meeting;

                    }
                );

            }
        );


        buildHeadToHeadTable(
            headToHeadTable,
            currentManagers,
            headToHead
        );


    } catch (
        error
    ) {

        console.error(
            'Error loading standings:',
            error
        );


        standingsBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="records-error"
                >
                    Unable to load standings.
                </td>

            </tr>

        `;


        headToHeadTable.innerHTML = `

            <tbody>

                <tr>

                    <td class="records-error">
                        Unable to load head-to-head history.
                    </td>

                </tr>

            </tbody>

        `;

    }

}



/*
 * ======================================================
 * BUILD HEAD TO HEAD TABLE
 * ======================================================
 */

function buildHeadToHeadTable(
    table,
    managers,
    headToHead
) {

    let html = `

        <thead>

            <tr>

                <th class="h2h-corner">
                    Owner
                </th>

    `;


    /*
     * COLUMN HEADERS
     *
     * Use true owner names instead of team names.
     */

    managers.forEach(
        manager => {

            html += `

                <th class="h2h-manager-header">

                    <span>
                        ${shortManagerName(
                            manager.owner
                        )}
                    </span>

                </th>

            `;

        }
    );


    html += `

            </tr>

        </thead>

        <tbody>

    `;


    /*
     * ROWS
     */

    managers.forEach(
        rowManager => {

            html += `

                <tr>

                    <th class="h2h-row-header">

                        <span class="h2h-owner">
                            ${rowManager.owner}
                        </span>

                    </th>

            `;


            managers.forEach(
                columnManager => {

                    if (
                        rowManager.owner_id ===
                        columnManager.owner_id
                    ) {

                        html += `

                            <td class="h2h-self">
                                —
                            </td>

                        `;

                        return;

                    }


                    const series =
                        headToHead[
                            rowManager.owner_id
                        ]?.[
                            columnManager.owner_id
                        ];


                    if (
                        !series
                    ) {

                        html += `

                            <td class="h2h-no-games">
                                —
                            </td>

                        `;

                        return;

                    }


                    const record =
                        formatRecord(
                            series.wins,
                            series.losses,
                            series.ties
                        );


                    const tooltip =
                        `${rowManager.owner} vs ${columnManager.owner}: ` +
                        `${record} | ` +
                        `PF ${series.points_for.toFixed(2)} - ` +
                        `${series.points_against.toFixed(2)}`;


                    html += `

                        <td
                            class="${seriesCellClass(series)}"
                            title="${tooltip}"
                        >

                            <strong>
                                ${record}
                            </strong>

                        </td>

                    `;

                }
            );


            html += `

                </tr>

            `;

        }
    );


    html += `

        </tbody>

    `;


    table.innerHTML =
        html;

}



/*
 * ======================================================
 * SERIES HELPERS
 * ======================================================
 */

function ensureSeries(
    map,
    managerId,
    opponentId
) {

    if (
        !map[
            managerId
        ][
            opponentId
        ]
    ) {

        map[
            managerId
        ][
            opponentId
        ] = {

            wins:
                0,

            losses:
                0,

            ties:
                0,

            points_for:
                0,

            points_against:
                0,

            latest:
                null

        };

    }

}



/*
 * ======================================================
 * CELL COLOR CLASS
 * ======================================================
 */

function seriesCellClass(
    series
) {

    if (
        series.wins >
        series.losses
    ) {

        return 'h2h-winning';

    }


    if (
        series.losses >
        series.wins
    ) {

        return 'h2h-losing';

    }


    return 'h2h-even';

}



/*
 * ======================================================
 * FORMAT RECORD
 * ======================================================
 */

function formatRecord(
    wins,
    losses,
    ties
) {

    if (
        Number(
            ties ||
            0
        ) >
        0
    ) {

        return (
            `${wins}-${losses}-${ties}`
        );

    }


    return `${wins}-${losses}`;

}



/*
 * ======================================================
 * FORMAT RANK
 * ======================================================
 */

function formatRank(
    rank
) {

    return rank;

}



/*
 * ======================================================
 * SHORT OWNER NAME
 * ======================================================
 */

function shortManagerName(
    name
) {

    if (
        !name
    ) {

        return '—';

    }


    /*
     * Owner names are generally short enough that
     * we can allow slightly more room than before.
     */

    if (
        name.length <=
        12
    ) {

        return name;

    }


    return (
        name.substring(
            0,
            11
        ) +
        '…'
    );

}


loadStandingsPage();
