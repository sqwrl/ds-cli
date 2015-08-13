/**
 * Created by sqwrl on 8/2/15.
 */

'use strict';

var fs      = require('fs'),
    async   = require('async'),
    yaml    = require('js-yaml'),
    logger  = global.logger,
    mapPath = './config/schemaMappings',
    map     = {};

/**
 * Function that loads a yml file and return the content
 * @type {Function}
 * @param {String} file - yml file to load
 * @param {Function} callback - callback function when operation complete
 */
module.exports.loadFile = function(file, callback) {


    // Try loading the file
    try {
        var nextMap;
        nextMap = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
        logger.debug(nextMap);
        callback(null, nextMap, file);
    } catch (err) {
        logger.error(err.message);
        if (err.code === 'ENOENT') {
            // File is not defined. That is not an error and we need to continue
            callback(null, nextMap, file);
        } else {
            callback(err, nextMap, file);
        }
    }
};

/**
 * Function that merges 2 objects
 * @type {Function}
 * @param {Object} main - the main object
 * @param {Object} toMerge - the object to merge into the main object
 * @param {Function} callback - callback function when operation complete
 */

function merge(main, toMerge, callback) {

    var newMain = mergeRecursive(main, toMerge);

    // walk through each property and update the main map
    function mergeRecursive(obj1, obj2) {

        for (var p in obj2) {
            if (obj2 !== 'SKIP') {
                try {
                    // Property in destination object set; update its value.
                    if (obj2[p].constructor.name !== 'String') {
                        obj1[p] = mergeRecursive(obj1[p], obj2[p]);
                    } else {
                        switch (obj2[p]) {
                            case 'DEPRECATED':
                                delete obj1[p];
                                break;
                            case 'SKIP':
                                break;
                            default:
                                obj1[p] = obj2[p];
                        }
                    }
                } catch (err) {
                    // Property in destination object not set; create it and set its value.
                    obj1[p] = obj2[p];
                }
            }
        }

        return obj1;
    }

    // complete the operation
    callback(null, newMain);
}

/**
 * Merge a settings file with the existing json object
 * @type {Function}
 * @param {String} type - string representing the type of system
 * @param {String} version - string representing the version to load
 * @param {Function} cb - callback function when operation complete
 */
module.exports.loadSchemaMappings = function(type, version, cb) {

    var folder = version.split('.');
    var files = [];
    files.push(mapPath + '/generic.yml');
    files.push(mapPath + '/' + type + '/' + folder[0] + '/major.yml');
    files.push(mapPath + '/' + type + '/' + folder[0] + '/' + folder[1] +  '/minor.yml');
    files.push(mapPath + '/' + type + '/' + folder[0] + '/' + folder[1] + '/' + folder[2] + '/point.yml');

    async.eachSeries(files, function(file, callback) {

        var doneMerging = function(err, map) {
            callback(null, map);
        };

        var doMerge = function(err, mapped, file) {
            if (!err) {
                if (file.match('generic')) {
                    // This is the generic file. Just load it, no need to merge yet
                    map = mapped;
                    callback(null, map);
                } else {
                    if (mapped) {
                        merge(map, mapped, doneMerging);
                    } else {
                        callback(null, map);
                    }
                }
            }
        };

        // load the file
        module.exports.loadFile(file, doMerge);

    }, function(err) {
        if (err) {
            logger.error(err);
            cb(err, map);
        } else {
            cb(null, map);
        }
    });
};
