async function loadStandingsPage() {

    const standingsBody =
        document.getElementById(
            'standings-page-body'
        );


    const headToHeadTable =
        document.getElementById(
            'head-to-head-table'
        );


    try {

        /*
         * =====================================================
         * LOAD CURRENT TEAMS + HISTORICAL MATCHUPS
         * =====================================================
         */

        const [
            teamsResponse,
            matchups2023Response,
            matchups2024Response,
            matchups2025Response,
            matchups2026Response
        ] = await Promise.all([

            fetch('/api/teams'),

            fetch(
                '/api/matchup-history?season=2023'
            ),

            fetch(
                '/api/matchup-history?season=2024'
            ),

            fetch(
                '/api/matchup-history?season=2025'
            ),

            fetch(
                '/api/matchup-history?season=2026'
            )

        ]);


        const responses = [

            teamsResponse,
            matchups2023Response,
            matchups2024Response,
            matchups2025Response,
            matchups2026Response

        ];


        if (
            responses.some(
                response => !response.ok
            )
        ) {

            throw new Error(
                'Unable to retrieve standings data.'
            );

        }


        const teamsData =
            await teamsResponse.json();


        const matchupData = [

            await matchups2023Response.json(),

            await matchups2024Response.json(),

            await matchups2025Response.json(),

            await matchups2026Response.json()

        ];


        if (!teamsData.teams) {

            throw new Error(
                'No teams returned.'
            );

        }


        /*
         * =====================================================
         * CURRENT STANDINGS
         * =====================================================
         */

        const teams =
            [...teamsData.teams];


        /*
         * Sort by:
         *
         * 1. Wins
         * 2. Fewer losses
         * 3. Points For
         */

        teams.sort(
            (a, b) => {

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
        );


        standingsBody.innerHTML = '';


        teams.forEach(
            (team, index) => {


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


                const rank =
                    index + 1;


                row.innerHTML = `

                    <td class="standing-rank">
                        ${formatRank(rank)}
                    </td>

                    <td class="standings-team-name">
                        ${team.team_name}
                    </td>

                    <td>
                        ${team.owner}
                    </td>

                    <td>
                        ${team.division || '—'}
                    </td>

                    <td>
                        ${record}
                    </td>

                    <td>
                        ${Number(
                            team.points_for || 0
                        ).toFixed(2)}
                    </td>

                `;


                standingsBody.appendChild(
                    row
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

        const headToHead = {};


        /*
         * Create every possible current-manager pairing.
         */

        currentManagers.forEach(
            manager => {

                headToHead[
                    manager.owner_id
                ] = {};

            }
        );


        /*
         * Process every historical game.
         */

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
                         * Head-to-head matrix is
                         * regular-season only.
                         */

                        if (game.playoff) {

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


                        /*
                         * Only include managers who are
                         * currently in the league.
                         */

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


                        /*
                         * Total scoring
                         */

                        firstSeries.points_for +=
                            first.points;

                        firstSeries.points_against +=
                            second.points;


                        secondSeries.points_for +=
                            second.points;

                        secondSeries.points_against +=
                            first.points;


                        /*
                         * Win / loss / tie
                         */

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
     * Do not count tied scores in the all-time
     * head-to-head table.
     */

    return;

}


                        /*
                         * Most recent meeting
                         */

                        const meeting = {

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


        /*
         * =====================================================
         * BUILD HEAD-TO-HEAD MATRIX
         * =====================================================
         */

        buildHeadToHeadTable(
            headToHeadTable,
            currentManagers,
            headToHead
        );


    } catch (error) {

        console.error(
            'Error loading standings:',
            error
        );


        standingsBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
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
                    Manager
                </th>

    `;


    /*
     * Column headers
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
     * Rows
     */

    managers.forEach(
        rowManager => {

            html += `

                <tr>

                    <th class="h2h-row-header">

                        <span class="h2h-owner">
                            ${rowManager.owner}
                        </span>

                        <small>
                            ${rowManager.team_name}
                        </small>

                    </th>

            `;


            managers.forEach(
                columnManager => {

                    /*
                     * Same manager.
                     */

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


                    if (!series) {

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

    if (rank === 1) {

        return '1';

    }


    return rank;

}



/*
 * ======================================================
 * SHORT MANAGER NAME
 * ======================================================
 */

function shortManagerName(
    name
) {

    if (!name) {

        return '—';

    }


    if (
        name.length <= 9
    ) {

        return name;

    }


    return (
        name.substring(
            0,
            8
        ) +
        '…'
    );

}


loadStandingsPage();
