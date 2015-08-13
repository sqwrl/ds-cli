/**
 *  Created by sqwrl on 7/30/15.
 */

/**
 * Initialize the app.
*/
'use strict';
require('./lib/logging');

var config          = require('config'),
    argv            = require('minimist')(process.argv.slice(2), {string: 'v'}),
    _               = require('lodash'),
    assert          = require('assert'),
    async           = require('async'),
    mapping         = require('./lib/mapping'),
    logger          = global.logger,
    sourceSystem    = '',
    version         = '',
    subSystem       = [];

/**
 * Parse and map any command line params
*/

logger.info('*************************************');
logger.info('Start application...');
logger.info('*************************************');

// Assert all the required params are provided
try {
    assert.equal(typeof argv.t, "string", "-t (type of system) needs to be defined as string");
    assert.equal(typeof argv.v, "string", "-v (version) needs to be defined as a string");
    assert.equal(typeof argv.s, "string", "-s (sub system) needs to be defined as a string");
} catch (err) {
    exit('PARAMS ERROR: ' + err);
}

async.series([
    function(callback) {
        // Check if valid source system is provided. If not, exit
        if (_.indexOf(config.sourceSystem, argv.t) >= 0) {
            sourceSystem =  argv.t;
            logger.info('Source System: ' + sourceSystem);
            callback(null);
        } else {
            callback('Source System not supported. Exit.');
        }
    },
    function(callback) {
        // Check if valid version for the source system is provided. If not, exit
        if (_.indexOf(config.version[argv.t], argv.v) >= 0) {
            version = argv.v;
            logger.info('Source Version: ' + version + '. Loading mapping file(s).');

            var cb = function(err, result) {
                global.schemaMap = result;
                callback(err, result);
            };

            //generate the schema mapping file
            mapping.loadSchemaMappings(sourceSystem, version, cb);
        } else {
            callback('Version not supported. Exit.');
        }
    },
    function (callback) {
        // Check if valid sub system(s) is/are provided. If not, exit
        if (argv.s === 'ALL') {
            subSystem = config.subSystem;
            logger.info('Sub Systems: ' + subSystem);
            callback(null);
        } else {
            var ss = argv.s.split(',');
            ss.forEach(function (s) {
                if (_.indexOf(config.subSystem, s) >= 0) {
                    subSystem.push(s);
                    logger.info('Subsystem ' + s + ' found');
                } else {
                    logger.info('Subsystem ' + s + ' not found. Skipping');
                }
            });

            //check if we have valid subsystems to work with
            if (!subSystem.length > 0) {
                callback('No valid subsystems to work with.');
            } else {
                callback(null);
            }
        }
    }
], function(err){
    if (err) {
        exit(err);
    } else {
        var md = require('./lib/migrateData');
        var options = {
            sourceSystem: sourceSystem,
            version: version,
            subSystem: subSystem
        };

        logger.info('*************************************');
        logger.info('Finished application start');
        logger.info('Start data migration');
        logger.info('*************************************');

        md(options);
    }
});


/**
 * The exit function is to end the application due to missing params
 *  or other error reasons
*/
function exit(err) {
    logger.error('Force exit and terminate the process.');
    logger.error(err);
    logger.error('*************************************');
    process.exit(1);
}
