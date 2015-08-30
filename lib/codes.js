/**
 *  Created by sqwrl on 8/29/15.
 */

/**
 * Initialize.
 */
'use strict';

/**
 * generate the system and configured codes and their descriptions
 * @type {Function}
 */
module.exports.generateCodes = function(useTestData) {
    if (useTestData) {
        require('../test/codes');
    }
};


