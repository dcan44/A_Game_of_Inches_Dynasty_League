/*
 * ======================================================
 * A GAME OF INCHES
 * CENTRAL LEAGUE DATA
 * ======================================================
 *
 * This file stores information that Sleeper does not
 * reliably provide, such as each manager's real name.
 *
 * IMPORTANT:
 * The USER ID is the permanent identifier.
 * Do not change the numbers on the left.
 *
 * To update a manager's real name, only change the
 * name inside the quotation marks on the right.
 * ======================================================
 */


window.LEAGUE_DATA = {


    /*
     * ==================================================
     * OWNER NAMES
     * ==================================================
     *
     * Includes both current and former managers.
     */

    ownerNames: {


        /*
         * ==================================================
         * CURRENT MANAGERS
         * ==================================================
         */


        /*
         * zmoore13
         */

        "462468578298294272":
            "Zach",


        /*
         * dcan44
         */

        "978544154789699584":
            "Dan",


        /*
         * RJ196
         */

        "978815135223525376":
            "RJ",


        /*
         * ProtagonistGoose
         */

        "979575504724455424":
            "Tyler",


        /*
         * JValdez23
         */

        "979818984721657856":
            "Jacob",


        /*
         * LogicsPC
         */

        "980566668231471104":
            "Pete",


        /*
         * ColeP96
         */

        "984489422731194368":
            "Cole",


        /*
         * ngen11
         */

        "985056136166473728":
            "Nick",


        /*
         * ChefBoySJ
         */

        "1060373241799262208":
            "Seth",


        /*
         * Sharonaxx
         */

        "1084347885749174272":
            "Adam",


        /*
         * Grenrc09
         */

        "1090303281726914560":
            "Ryan",


        /*
         * ajgenova
         */

        "1131371199969431552":
            "AJ",



        /*
         * ==================================================
         * FORMER MANAGERS
         * ==================================================
         */


        /*
         * Caiden19
         */

        "980232082209161216":
            "Caiden",


        /*
         * Ridge5
         */

        "980385402664067072":
            "Ridge",


        /*
         * mitchnixon23
         */

        "984274697955102720":
            "Mitch",


        /*
         * Brandonwastaken
         */

        "984495671757611008":
            "Brandon"

    },


    /*
     * ==================================================
     * GET OWNER NAME
     * ==================================================
     *
     * If an owner ID exists above, return their real
     * name.
     *
     * Otherwise return the fallback supplied by the
     * page, usually their Sleeper username.
     */

    getOwnerName(
        ownerId,
        fallback = "Unknown Manager"
    ) {

        return (
            this.ownerNames[
                String(ownerId)
            ] ||
            fallback
        );

    }

};


/*
 * ======================================================
 * GLOBAL COMPATIBILITY
 * ======================================================
 *
 * This allows both:
 *
 * window.LEAGUE_DATA
 *
 * and:
 *
 * LEAGUE_DATA
 *
 * to work throughout the website.
 */

var LEAGUE_DATA =
    window.LEAGUE_DATA;
