const seasonSelect =
    document.getElementById(
        'draft-season-select'
    );


const draftSummary =
    document.getElementById(
        'draft-summary'
    );


const draftOrderGrid =
    document.getElementById(
        'draft-order-grid'
    );


const draftBoard =
    document.getElementById(
        'draft-board'
    );



async function loadDraft(
    season
) {

    try {

        /*
         * Loading state
         */

        draftSummary.innerHTML =
            'Loading draft...';


        draftOrderGrid.innerHTML =
            'Loading draft order...';


        draftBoard.innerHTML =
            'Loading draft board...';


        /*
         * Retrieve draft data
         */

        const response =
            await fetch(
                `/api/draft-data?season=${season}`
            );


        if (!response.ok) {

            throw new Error(
                'Unable to retrieve draft data.'
            );

        }


        const data =
            await response.json();


        /*
         * No draft exists for this season.
         */

        if (!data.draft) {

            showNoDraft(
                season
            );

            return;

        }


        /*
         * =====================================================
         * DRAFT SUMMARY
         * =====================================================
         */

        const status =
            formatDraftStatus(
                data.draft.status
            );


        draftSummary.innerHTML = `

            <div class="draft-summary-item">

                <span>
                    Season
                </span>

                <strong>
                    ${season}
                </strong>

            </div>


            <div class="draft-summary-item">

                <span>
                    Status
                </span>

                <strong>
                    ${status}
                </strong>

            </div>


            <div class="draft-summary-item">

                <span>
                    Teams
                </span>

                <strong>
                    ${data.draft.teams || '—'}
                </strong>

            </div>


            <div class="draft-summary-item">

                <span>
                    Rounds
                </span>

                <strong>
                    ${data.draft.rounds || '—'}
                </strong>

            </div>


            <div class="draft-summary-item">

                <span>
                    Format
                </span>

                <strong>
                    ${formatDraftType(
                        data.draft.type
                    )}
                </strong>

            </div>


            <div class="draft-summary-item">

                <span>
                    Picks Made
                </span>

                <strong>
                    ${data.picks.length}
                </strong>

            </div>

        `;


        /*
         * =====================================================
         * ORIGINAL DRAFT ORDER
         * =====================================================
         */

        buildDraftOrder(
            data.draft.draft_order || []
        );


        /*
         * =====================================================
         * DRAFT BOARD
         * =====================================================
         */

        buildDraftBoard(
            data.picks || [],
            data.draft.rounds || 0,
            data.draft.teams || 12
        );


    } catch (error) {

        console.error(
            'Draft error:',
            error
        );


        draftSummary.innerHTML = `

            <div class="draft-error">
                Unable to load draft information.
            </div>

        `;


        draftOrderGrid.innerHTML = '';


        draftBoard.innerHTML = '';

    }

}



/*
 * ======================================================
 * ORIGINAL DRAFT ORDER
 * ======================================================
 */

function buildDraftOrder(
    order
) {

    draftOrderGrid.innerHTML = '';


    if (
        !order ||
        order.length === 0
    ) {

        draftOrderGrid.innerHTML = `

            <div class="draft-empty">
                Draft order unavailable.
            </div>

        `;

        return;

    }


    order.forEach(
        team => {

            const card =
                document.createElement(
                    'div'
                );


            card.className =
                'draft-order-card';


            card.innerHTML = `

                <span class="draft-order-number">

                    ${team.slot}

                </span>


                <div>

                    <strong>
                        ${team.team_name}
                    </strong>

                    <small>
                        ${
                            window.LEAGUE_DATA &&
                            typeof window.LEAGUE_DATA.getOwnerName ===
                                'function'
                                ? window.LEAGUE_DATA.getOwnerName(
                                    team.owner_id,
                                    team.owner
                                  )
                                : team.owner
                        }
                    </small>

                </div>

            `;


            draftOrderGrid.appendChild(
                card
            );

        }
    );

}



/*
 * ======================================================
 * DRAFT BOARD
 * ======================================================
 */

function buildDraftBoard(
    picks,
    rounds,
    teams
) {

    draftBoard.innerHTML = '';


    if (
        !picks ||
        picks.length === 0
    ) {

        draftBoard.innerHTML = `

            <div class="draft-empty">
                No draft selections available.
            </div>

        `;

        return;

    }


    /*
     * Create a lookup using round + draft slot.
     */

    const pickMap = {};


    picks.forEach(
        pick => {

            const key =
                `${pick.round}-${pick.draft_slot}`;


            pickMap[
                key
            ] = pick;

        }
    );


    /*
     * Build each round.
     */

    for (
        let round = 1;
        round <= rounds;
        round++
    ) {

        const roundRow =
            document.createElement(
                'div'
            );


        roundRow.className =
            'draft-round-row';


        /*
         * Round label
         */

        const roundLabel =
            document.createElement(
                'div'
            );


        roundLabel.className =
            'draft-round-label';


        roundLabel.innerHTML = `

            <span>
                Round
            </span>

            <strong>
                ${round}
            </strong>

        `;


        roundRow.appendChild(
            roundLabel
        );


        /*
         * Picks 1-12
         */

        for (
            let slot = 1;
            slot <= teams;
            slot++
        ) {

            const key =
                `${round}-${slot}`;


            const pick =
                pickMap[
                    key
                ];


            const cell =
                document.createElement(
                    'div'
                );


            cell.className =
                'draft-pick-card';


            if (!pick) {

                cell.classList.add(
                    'draft-pick-empty'
                );


                cell.innerHTML = `

                    <span class="draft-pick-number">

                        ${round}.${String(slot).padStart(2, '0')}

                    </span>

                    <strong>
                        —
                    </strong>

                `;

            }

            else {

                /*
                 * =================================================
                 * POSITION COLOR CLASS
                 * =================================================
                 *
                 * Examples:
                 *
                 * QB -> draft-position-qb
                 * RB -> draft-position-rb
                 * WR -> draft-position-wr
                 * TE -> draft-position-te
                 * DL -> draft-position-dl
                 * LB -> draft-position-lb
                 * DB -> draft-position-db
                 * K  -> draft-position-k
                 */

                const position =
                    (
                        pick.position ||
                        ''
                    )
                        .toUpperCase();


                if (
                    position
                ) {

                    cell.classList.add(
                        `draft-position-${position.toLowerCase()}`
                    );

                }


                const playerName =
                    `${pick.first_name} ${pick.last_name}`
                        .trim();


                const playerDetail =
                    [
                        pick.position,
                        pick.nfl_team
                    ]
                        .filter(Boolean)
                        .join(' • ');


                cell.innerHTML = `

                    <span class="draft-pick-number">

                        ${round}.${String(slot).padStart(2, '0')}

                    </span>


                    <strong class="draft-player-name">

                        ${playerName || 'Unknown Player'}

                    </strong>


                    <span class="draft-player-detail">

                        ${playerDetail || '—'}

                    </span>


                    <span class="draft-picker">

                        ${pick.team_name}

                    </span>


                    <small>

                        ${
                            window.LEAGUE_DATA &&
                            typeof window.LEAGUE_DATA.getOwnerName ===
                                'function'
                                ? window.LEAGUE_DATA.getOwnerName(
                                    pick.picked_by,
                                    pick.manager
                                  )
                                : pick.manager
                        }

                    </small>

                `;

            }


            roundRow.appendChild(
                cell
            );

        }


        draftBoard.appendChild(
            roundRow
        );

    }

}



/*
 * ======================================================
 * NO DRAFT
 * ======================================================
 */

function showNoDraft(
    season
) {

    draftSummary.innerHTML = `

        <div class="draft-empty">

            No Sleeper draft was found for ${season}.

        </div>

    `;


    draftOrderGrid.innerHTML = '';


    draftBoard.innerHTML = '';

}



/*
 * ======================================================
 * FORMAT STATUS
 * ======================================================
 */

function formatDraftStatus(
    status
) {

    if (
        status === 'complete'
    ) {

        return 'Complete';

    }


    if (
        status === 'drafting'
    ) {

        return 'Live';

    }


    if (
        status === 'pre_draft'
    ) {

        return 'Upcoming';

    }


    return status || 'Unknown';

}



/*
 * ======================================================
 * FORMAT TYPE
 * ======================================================
 */

function formatDraftType(
    type
) {

    if (
        type === 'snake'
    ) {

        return 'Snake';

    }


    if (
        type === 'linear'
    ) {

        return 'Linear';

    }


    return type || '—';

}



/*
 * ======================================================
 * SEASON SELECT
 * ======================================================
 */

seasonSelect.addEventListener(
    'change',
    event => {

        loadDraft(
            event.target.value
        );

    }
);



/*
 * Load current archive.
 */

loadDraft(
    seasonSelect.value
);
