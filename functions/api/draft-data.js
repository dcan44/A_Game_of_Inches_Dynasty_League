export async function onRequestGet(context) {

    /*
     * =====================================================
     * LEAGUE IDS BY SEASON
     * =====================================================
     */

    const leagueIds = {

        2023:
            "978545340355862528",

        2024:
            "1050836306860957696",

        2025:
            "1181097603123351552",

        2026:
            "1312098239821914112"

    };


    try {

        /*
         * =====================================================
         * REQUESTED SEASON
         * =====================================================
         *
         * Example:
         *
         * /api/draft-data?season=2026
         */

        const url =
            new URL(
                context.request.url
            );


        const requestedSeason =
            Number(
                url.searchParams.get(
                    "season"
                )
            );


        if (
            !leagueIds[
                requestedSeason
            ]
        ) {

            return new Response(

                JSON.stringify(
                    {

                        error:
                            "Please provide a valid season.",

                        available_seasons:
                            Object.keys(
                                leagueIds
                            )

                    },
                    null,
                    2
                ),

                {

                    status:
                        400,

                    headers: {

                        "Content-Type":
                            "application/json"

                    }

                }

            );

        }


        const leagueId =
            leagueIds[
                requestedSeason
            ];


        /*
         * =====================================================
         * GET LEAGUE USERS
         * =====================================================
         */

        const usersResponse =
            await fetch(
                `https://api.sleeper.app/v1/league/${leagueId}/users`
            );


        const users =
            usersResponse.ok
                ? await usersResponse.json()
                : [];


        /*
         * =====================================================
         * GET DRAFTS
         * =====================================================
         */

        const draftsResponse =
            await fetch(
                `https://api.sleeper.app/v1/league/${leagueId}/drafts`
            );


        if (
            !draftsResponse.ok
        ) {

            throw new Error(
                "Unable to retrieve draft information."
            );

        }


        const drafts =
            await draftsResponse.json();


        /*
         * Most dynasty leagues will have one relevant
         * rookie/free-agent draft per season.
         */

        const draft =
            drafts.length > 0
                ? drafts[0]
                : null;


        if (!draft) {

            return new Response(

                JSON.stringify(
                    {

                        season:
                            requestedSeason,

                        league_id:
                            leagueId,

                        draft:
                            null,

                        picks:
                            []

                    },
                    null,
                    2
                ),

                {

                    headers: {

                        "Content-Type":
                            "application/json"

                    }

                }

            );

        }


        /*
         * =====================================================
         * GET PICKS
         * =====================================================
         */

        const picksResponse =
            await fetch(
                `https://api.sleeper.app/v1/draft/${draft.draft_id}/picks`
            );


        const picks =
            picksResponse.ok
                ? await picksResponse.json()
                : [];


        /*
         * =====================================================
         * USER LOOKUP
         * =====================================================
         */

        const userMap = {};


        users.forEach(
            user => {

                userMap[
                    user.user_id
                ] = {

                    owner_id:
                        user.user_id,

                    owner:
                        user.display_name,

                    team_name:
                        user
                            ?.metadata
                            ?.team_name
                            ?.trim() ||
                        user.display_name

                };

            }
        );


        /*
         * =====================================================
         * FORMAT DRAFT ORDER
         * =====================================================
         */

        const draftOrder = [];


        if (
            draft.draft_order
        ) {

            Object.entries(
                draft.draft_order
            ).forEach(
                ([ownerId, slot]) => {

                    const user =
                        userMap[
                            ownerId
                        ];


                    draftOrder.push(
                        {

                            slot:
                                Number(
                                    slot
                                ),

                            owner_id:
                                ownerId,

                            owner:
                                user?.owner ||
                                "Unknown Owner",

                            team_name:
                                user?.team_name ||
                                user?.owner ||
                                "Unknown Team"

                        }
                    );

                }
            );


            draftOrder.sort(
                (a, b) =>
                    a.slot -
                    b.slot
            );

        }


        /*
         * =====================================================
         * FORMAT PICKS
         * =====================================================
         */

        const formattedPicks =
            picks.map(
                pick => {

                    const pickedBy =
                        userMap[
                            pick.picked_by
                        ];


                    return {

                        pick_no:
                            pick.pick_no,

                        round:
                            pick.round,

                        draft_slot:
                            pick.draft_slot,

                        roster_id:
                            pick.roster_id,

                        player_id:
                            pick.player_id,

                        picked_by:
                            pick.picked_by,

                        manager:
                            pickedBy?.owner ||
                            "Unknown Owner",

                        team_name:
                            pickedBy?.team_name ||
                            pickedBy?.owner ||
                            "Unknown Team",

                        first_name:
                            pick.metadata
                                ?.first_name ||
                            "",

                        last_name:
                            pick.metadata
                                ?.last_name ||
                            "",

                        position:
                            pick.metadata
                                ?.position ||
                            "",

                        nfl_team:
                            pick.metadata
                                ?.team ||
                            "",

                        years_exp:
                            pick.metadata
                                ?.years_exp ||
                            null

                    };

                }
            );


        /*
         * =====================================================
         * RETURN DRAFT DATA
         * =====================================================
         */

        return new Response(

            JSON.stringify(
                {

                    season:
                        requestedSeason,

                    league_id:
                        leagueId,

                    draft: {

                        draft_id:
                            draft.draft_id,

                        status:
                            draft.status,

                        type:
                            draft.type,

                        rounds:
                            draft.settings
                                ?.rounds ||
                            null,

                        teams:
                            draft.settings
                                ?.teams ||
                            null,

                        start_time:
                            draft.start_time,

                        created:
                            draft.created,

                        last_picked:
                            draft.last_picked,

                        draft_order:
                            draftOrder

                    },

                    picks:
                        formattedPicks

                },
                null,
                2
            ),

            {

                headers: {

                    "Content-Type":
                        "application/json"

                }

            }

        );


    } catch (
        error
    ) {

        return new Response(

            JSON.stringify(
                {

                    error:
                        error.message

                },
                null,
                2
            ),

            {

                status:
                    500,

                headers: {

                    "Content-Type":
                        "application/json"

                }

            }

        );

    }

}
