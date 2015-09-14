/**
 * Created by sqwrl on 8/2/15.
 */

'use strict';

var fs      = require('fs'),
    async   = require('async'),
    yaml    = require('js-yaml'),
    _       = require('lodash'),
    logger  = global.logger,
    mapPath = './config/dataMapping';

/**
 * Function that loads a yml file and return the content
 * @type {Function}
 * @param {String} file - yml file to load
 * @param {Function} cb - callback function when operation complete
 */
module.exports.loadFile = function(file, cb) {

    var err = null;
    var nextMap = {};
    // Try loading the file
    try {
        nextMap = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
        logger.debug(nextMap);
    } catch (err) {
        if (err.code === 'ENOENT') {
            // File is not defined. That is not an error and we need to continue
            err = null;
        } else {
            logger.error(err.message);
        }
    } finally {
        cb(err, nextMap, file);
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

    var idx = _.findIndex(main, { type: toMerge.type });
    var newMain = mergeRecursive(main[idx], toMerge.doc);

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
 * @param {String} ss - string representing the sub system config to load
 * @param {Function} cb - callback function when operation complete
 */
module.exports.createFieldMapping = function(type, version, ss, cb) {
    var folder = version.split('.');
    var map = [];
    var mapPathSubSystem = mapPath + '/' + ss.toLowerCase();
    var mapPathIndexTypes = [];

    // determine which index types are defined
    var typeFolders = fs.readdirSync(mapPathSubSystem);
    for (var tf = 0; tf < typeFolders.length; tf++) {
        var typePath = mapPathSubSystem + '/' + typeFolders[tf] + '/';
        var typeFiles = {
            type: typeFolders[tf],
            files: [
                typePath + 'generic.yml',
                typePath + '/' + type + '/' + folder[0] + '/major.yml',
                typePath + '/' + type + '/' + folder[0] + '/' + folder[1] +  '/minor.yml',
                typePath + '/' + type + '/' + folder[0] + '/' + folder[1] + '/' + folder[2] + '/point.yml'
            ]
        };
        mapPathIndexTypes.push(typeFiles);
    }

    for (var ft = 0; ft < mapPathIndexTypes.length; ft++) {
        var indexType = mapPathIndexTypes[ft].type;
        logger.debug('loop through index types: ' + indexType);
        async.each(mapPathIndexTypes[ft].files,
            function (file, callback) {
                logger.debug('async.eachseries: ' + file);

                // load the file
                module.exports.loadFile(file, function (err, mapped, file) {
                    if (!err) {
                        if (file.match('generic')) {
                            // This is the generic file. Just load it, no need to merge yet
                            map.push(mapped);
                            callback(null, map);
                        } else {
                            if (mapped !== undefined) {
                                if (mapped.hasOwnProperty('doc')) {
                                    var toMap = {
                                        type: indexType,
                                        doc: mapped
                                    };
                                    merge(map, toMap, function (err, map) {
                                        callback(null, map);
                                    });
                                } else {
                                    callback(null, map);
                                }
                            }
                        }
                    }
                });
            },
            function (err) {
                if (err) {
                    logger.error(err);
                    cb(err, map);
                } else {
                    cb(null, map);
                }
            }
        );
    }
};
