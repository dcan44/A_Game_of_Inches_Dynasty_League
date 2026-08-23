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
 *
 * Example:
 *
 * "978544154789699584": "Dan"
 *
 * ======================================================
 */


const LEAGUE_DATA = {


    /*
     * ==================================================
     * OWNER NAMES
     * ==================================================
     *
     * User ID : Owner Name
     *
     * For now, Sleeper usernames are being used as
     * placeholders. Replace each username with the
     * manager's actual name.
     */

    ownerNames: {

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
            "AJ"

    },


    /*
     * ==================================================
     * GET OWNER NAME
     * ==================================================
     *
     * Pages can use this helper instead of accessing
     * ownerNames directly.
     *
     * If an owner has not been entered into this file,
     * the supplied fallback name will be displayed.
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
