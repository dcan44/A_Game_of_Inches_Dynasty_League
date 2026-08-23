/*
 * ======================================================
 * A GAME OF INCHES
 * RULES / CONSTITUTION
 * ======================================================
 *
 * Live league settings are pulled directly from Sleeper.
 *
 * Static constitutional rules remain in rules.html.
 * ======================================================
 */


const CURRENT_LEAGUE_ID =
    "1312098239821914112";


const rosterSettingsContainer =
    document.getElementById(
        'rules-roster-settings'
    );


const scoringSettingsContainer =
    document.getElementById(
        'rules-scoring-settings'
    );



/*
 * ======================================================
 * LOAD LIVE LEAGUE SETTINGS
 * ======================================================
 */

async function loadLeagueRules() {

    try {

        const response =
            await fetch(
                `https://api.sleeper.app/v1/league/${CURRENT_LEAGUE_ID}`
            );


        if (
            !response.ok
        ) {

            throw new Error(
                'Unable to retrieve Sleeper league settings.'
            );

        }


        const league =
            await response.json();


        renderRosterSettings(
            league
        );


        renderScoringSettings(
            league.scoring_settings || {}
        );


    } catch (
        error
    ) {

        console.error(
            'Rules error:',
            error
        );


        if (
            rosterSettingsContainer
        ) {

            rosterSettingsContainer.innerHTML = `

                <div class="rules-live-error">

                    Unable to load roster settings.

                </div>

            `;

        }


        if (
            scoringSettingsContainer
        ) {

            scoringSettingsContainer.innerHTML = `

                <div class="rules-live-error">

                    Unable to load scoring settings.

                </div>

            `;

        }

    }

}



/*
 * ======================================================
 * ROSTER CONFIGURATION
 * ======================================================
 */

function renderRosterSettings(
    league
) {

    if (
        !rosterSettingsContainer
    ) {

        return;

    }


    const rosterPositions =
        league.roster_positions || [];


    const settings =
        league.settings || {};


    /*
     * Count every starting position.
     *
     * BN and IR are handled separately below.
     */

    const positionCounts =
        {};


    rosterPositions.forEach(
        position => {

            if (
                position === 'BN' ||
                position === 'IR'
            ) {

                return;

            }


            positionCounts[
                position
            ] =
                (
                    positionCounts[
                        position
                    ] ||
                    0
                ) +
                1;

        }
    );


    /*
     * Sleeper position codes translated into
     * human-readable names.
     */

    const positionNames = {

        QB:
            'Quarterback',

        RB:
            'Running Back',

        WR:
            'Wide Receiver',

        TE:
            'Tight End',

        FLEX:
            'Flex',

        SUPER_FLEX:
            'Superflex',

        K:
            'Kicker',

        DEF:
            'Team Defense',

        DL:
            'Defensive Line',

        LB:
            'Linebacker',

        DB:
            'Defensive Back',

        IDP_FLEX:
            'IDP Flex'

    };


    /*
     * Preferred display order.
     */

    const displayOrder = [

        'QB',
        'RB',
        'WR',
        'TE',
        'FLEX',
        'SUPER_FLEX',
        'K',
        'DL',
        'LB',
        'DB',
        'IDP_FLEX',
        'DEF'

    ];


    let startersHTML =
        '';


    displayOrder.forEach(
        position => {

            const count =
                positionCounts[
                    position
                ];


            if (
                !count
            ) {

                return;

            }


            startersHTML +=
                rosterSettingCard(
                    positionNames[
                        position
                    ] ||
                    position,
                    count
                );

        }
    );


    /*
     * Catch any position Sleeper adds in the future
     * that isn't already in displayOrder.
     */

    Object.entries(
        positionCounts
    ).forEach(
        ([position, count]) => {

            if (
                displayOrder.includes(
                    position
                )
            ) {

                return;

            }


            startersHTML +=
                rosterSettingCard(
                    formatSettingName(
                        position
                    ),
                    count
                );

        }
    );


    /*
     * Bench / IR
     *
     * We count these directly from roster_positions
     * because that is Sleeper's actual roster
     * configuration.
     */

    const benchSlots =
        rosterPositions.filter(
            position =>
                position === 'BN'
        ).length;


const irSlots =
    Number(
        settings.reserve_slots ||
        0
    );


    /*
     * Taxi is stored in league.settings.
     */

    const taxiSlots =
        Number(
            settings.taxi_slots ||
            0
        );


    /*
     * Starting lineup count.
     */

    const starterCount =
        Object.values(
            positionCounts
        )
            .reduce(
                (
                    total,
                    count
                ) =>
                    total +
                    count,
                0
            );


    /*
     * Active roster = starters + bench.
     *
     * IR and Taxi are shown separately because they
     * are reserve designations rather than active
     * roster positions.
     */

    const activeRosterSize =
        starterCount +
        benchSlots;


    rosterSettingsContainer.innerHTML = `

        <div class="rules-live-summary">

            <div class="rules-summary-stat">

                <span>
                    Starters
                </span>

                <strong>
                    ${starterCount}
                </strong>

            </div>


            <div class="rules-summary-stat">

                <span>
                    Bench
                </span>

                <strong>
                    ${benchSlots}
                </strong>

            </div>


            <div class="rules-summary-stat">

                <span>
                    Active Roster
                </span>

                <strong>
                    ${activeRosterSize}
                </strong>

            </div>


            <div class="rules-summary-stat">

                <span>
                    IR
                </span>

                <strong>
                    ${irSlots}
                </strong>

            </div>


            <div class="rules-summary-stat">

                <span>
                    Taxi Squad
                </span>

                <strong>
                    ${taxiSlots}
                </strong>

            </div>

        </div>


        <h3 class="rules-live-subtitle">
            Starting Lineup
        </h3>


        <div class="rules-roster-grid">

            ${startersHTML}

        </div>

    `;

}



/*
 * ======================================================
 * ROSTER SETTING CARD
 * ======================================================
 */

function rosterSettingCard(
    label,
    value
) {

    return `

        <div class="rules-roster-position">

            <span>
                ${label}
            </span>

            <strong>
                ${value}
            </strong>

        </div>

    `;

}



/*
 * ======================================================
 * SCORING SETTINGS
 * ======================================================
 */

function renderScoringSettings(
    scoring
) {

    if (
        !scoringSettingsContainer
    ) {

        return;

    }


    /*
     * ==================================================
     * SCORING LABELS
     * ==================================================
     *
     * Sleeper uses short API field names. These labels
     * turn the settings into readable league rules.
     *
     * Any unknown non-zero Sleeper setting is displayed
     * automatically in "Other Scoring".
     */


    const categories = {


        /*
         * ==============================================
         * PASSING
         * ==============================================
         */

        Passing: {

            pass_yd:
                'Passing Yard',

            pass_td:
                'Passing Touchdown',

            pass_int:
                'Interception Thrown',

            pass_2pt:
                'Passing 2-Point Conversion',

            pass_sack:
                'Sack Taken',

            pass_fd:
                'Passing First Down',

            bonus_pass_yd_300:
                '300+ Passing Yards',

            bonus_pass_yd_400:
                '400+ Passing Yards',

            bonus_pass_td_40p:
                '40+ Yard Passing Touchdown',

            bonus_pass_td_50p:
                '50+ Yard Passing Touchdown'

        },


        /*
         * ==============================================
         * RUSHING
         * ==============================================
         */

        Rushing: {

            rush_yd:
                'Rushing Yard',

            rush_td:
                'Rushing Touchdown',

            rush_2pt:
                'Rushing 2-Point Conversion',

            rush_fd:
                'Rushing First Down',

            bonus_rush_yd_100:
                '100+ Rushing Yards',

            bonus_rush_yd_200:
                '200+ Rushing Yards',

            bonus_rush_td_40p:
                '40+ Yard Rushing Touchdown',

            bonus_rush_td_50p:
                '50+ Yard Rushing Touchdown'

        },


        /*
         * ==============================================
         * RECEIVING
         * ==============================================
         */

        Receiving: {

            rec:
                'Reception',

            rec_yd:
                'Receiving Yard',

            rec_td:
                'Receiving Touchdown',

            rec_2pt:
                'Receiving 2-Point Conversion',

            rec_fd:
                'Receiving First Down',

            bonus_rec_te:
                'Tight End Reception Bonus',

            bonus_rec_rb:
                'Running Back Reception Bonus',

            bonus_rec_wr:
                'Wide Receiver Reception Bonus',

            bonus_rec_yd_100:
                '100+ Receiving Yards',

            bonus_rec_yd_200:
                '200+ Receiving Yards',

            bonus_rec_td_40p:
                '40+ Yard Receiving Touchdown',

            bonus_rec_td_50p:
                '50+ Yard Receiving Touchdown'

        },


        /*
         * ==============================================
         * TURNOVERS / MISC OFFENSE
         * ==============================================
         */

        'Turnovers & Misc.': {

            fum:
                'Fumble',

            fum_lost:
                'Fumble Lost',

            fum_rec_td:
                'Fumble Recovery Touchdown',

            st_td:
                'Special Teams Touchdown',

            blk_kick:
                'Blocked Kick'

        },


        /*
         * ==============================================
         * KICKING
         * ==============================================
         */

        Kicking: {

            xpm:
                'Extra Point Made',

            xpmiss:
                'Extra Point Missed',

            fgm:
                'Field Goal Made',

            fgmiss:
                'Field Goal Missed',

            fgmiss_0_19:
                'Missed FG — 0-19 Yards',

            fgmiss_20_29:
                'Missed FG — 20-29 Yards',

            fgmiss_30_39:
                'Missed FG — 30-39 Yards',

            fgmiss_40_49:
                'Missed FG — 40-49 Yards',

            fgmiss_50p:
                'Missed FG — 50+ Yards',

            fgm_0_19:
                'FG Made — 0-19 Yards',

            fgm_20_29:
                'FG Made — 20-29 Yards',

            fgm_30_39:
                'FG Made — 30-39 Yards',

            fgm_40_49:
                'FG Made — 40-49 Yards',

            fgm_50p:
                'FG Made — 50+ Yards',

            fgm_yds:
                'Field Goal Yards',

            fgmiss_yds:
                'Missed Field Goal Yards'

        },


        /*
         * ==============================================
         * IDP / DEFENSE
         * ==============================================
         */

        'IDP / Defense': {

            idp_tkl:
                'Tackle',

            idp_tkl_solo:
                'Solo Tackle',

            idp_tkl_ast:
                'Assisted Tackle',

            idp_tkl_loss:
                'Tackle for Loss',

            idp_tkl_loss_yd:
                'Tackle for Loss Yard',

            idp_sack:
                'Sack',

            idp_sack_yd:
                'Sack Yard',

            idp_qb_hit:
                'Quarterback Hit',

            idp_pass_def:
                'Pass Defended',

            idp_int:
                'Interception',

            idp_int_ret_yd:
                'Interception Return Yard',

            idp_int_td:
                'Interception Return Touchdown',

            idp_ff:
                'Forced Fumble',

            idp_fum_rec:
                'Fumble Recovery',

            idp_fum_ret_yd:
                'Fumble Return Yard',

            idp_fum_rec_td:
                'Fumble Recovery Touchdown',

            idp_safety:
                'Safety',

            idp_def_td:
                'Defensive Touchdown',

            idp_blk_kick:
                'Blocked Kick',

            idp_2pt_return:
                'Defensive 2-Point Return'

        }

    };


    /*
     * Track settings we recognize so that any custom
     * scoring rule not listed above can still appear.
     */

    const recognizedSettings =
        new Set();


    let categoriesHTML =
        '';


    Object.entries(
        categories
    ).forEach(
        ([categoryName, settingsMap]) => {

            const rows =
                [];


            Object.entries(
                settingsMap
            ).forEach(
                ([key, label]) => {

                    recognizedSettings.add(
                        key
                    );


                    const value =
                        Number(
                            scoring[
                                key
                            ]
                        );


                    /*
                     * Hide unused scoring categories.
                     */

                    if (
                        !Number.isFinite(
                            value
                        ) ||
                        value === 0
                    ) {

                        return;

                    }


                    rows.push(
                        scoringRow(
                            label,
                            value,
                            key
                        )
                    );

                }
            );


            if (
                rows.length === 0
            ) {

                return;

            }


            categoriesHTML += `

                <div class="rules-scoring-category">

                    <h3>
                        ${categoryName}
                    </h3>

                    <div class="rules-scoring-table">

                        ${rows.join('')}

                    </div>

                </div>

            `;

        }
    );


    /*
     * ==================================================
     * UNKNOWN / FUTURE SETTINGS
     * ==================================================
     *
     * This keeps the page future-proof. If Sleeper adds
     * or your league enables a scoring setting we haven't
     * explicitly translated above, it will still appear.
     */

    const otherRows =
        [];


    Object.entries(
        scoring
    ).forEach(
        ([key, rawValue]) => {

            if (
                recognizedSettings.has(
                    key
                )
            ) {

                return;

            }


            const value =
                Number(
                    rawValue
                );


            if (
                !Number.isFinite(
                    value
                ) ||
                value === 0
            ) {

                return;

            }


            otherRows.push(
                scoringRow(
                    formatSettingName(
                        key
                    ),
                    value,
                    key
                )
            );

        }
    );


    if (
        otherRows.length > 0
    ) {

        categoriesHTML += `

            <div class="rules-scoring-category">

                <h3>
                    Other Scoring
                </h3>

                <div class="rules-scoring-table">

                    ${otherRows.join('')}

                </div>

            </div>

        `;

    }


    scoringSettingsContainer.innerHTML = `

        <div class="rules-scoring-grid">

            ${categoriesHTML}

        </div>

    `;

}



/*
 * ======================================================
 * SCORING ROW
 * ======================================================
 */

function scoringRow(
    label,
    value,
    key
) {

    return `

        <div
            class="rules-scoring-row"
            title="${key}"
        >

            <span>
                ${label}
            </span>

            <strong>
                ${formatScoringValue(
                    value
                )}
            </strong>

        </div>

    `;

}



/*
 * ======================================================
 * FORMAT SCORING VALUE
 * ======================================================
 */

function formatScoringValue(
    value
) {

    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return '—';

    }


    /*
     * Avoid displaying values like 1.00 or -2.00.
     */

    if (
        Number.isInteger(
            number
        )
    ) {

        return number > 0
            ? `+${number}`
            : `${number}`;

    }


    const formatted =
        number
            .toFixed(3)
            .replace(
                /0+$/,
                ''
            )
            .replace(
                /\.$/,
                ''
            );


    return number > 0
        ? `+${formatted}`
        : formatted;

}



/*
 * ======================================================
 * FORMAT UNKNOWN SETTING NAME
 * ======================================================
 */

function formatSettingName(
    key
) {

    return String(
        key
    )
        .replace(
            /_/g,
            ' '
        )
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );

}



/*
 * ======================================================
 * INITIAL LOAD
 * ======================================================
 */

loadLeagueRules();
