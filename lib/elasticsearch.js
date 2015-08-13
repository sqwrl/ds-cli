/**
 *  Created by sqwrl on 7/30/15.
 */

/**
 * Initialize.
 */
'use strict';
var elasticsearch   = require('elasticsearch'),
    async           = require('async'),
    config          = require('config'),
    _               = require('lodash'),
    mapping         = require('./mapping'),
    logger          = global.logger;

/**
 * Create client.
 */
var client = new elasticsearch.Client({
    host: config.database.target.server,
    sniffOnStart: config.database.target.sniffOnStart,
    log: [{
        type: config.database.target.log.type,
        levels: config.database.target.log.levels
    }],
    apiVersion: config.database.target.apiVersion
});

function testConnection(callback) {

    logger.info('*** ping elasticsearch');
    client.ping({
        // undocumented params are appended to the query string
        hello: "elasticsearch!"
    }, function (err) {
        if (err) {
            logger.error('ELASTIC SEARCH CLUSTER IS DOWN!');
            callback(err);
        } else {
            logger.info('*** elasticsearch responding');
            callback(null);
        }

    });
}

/**
 * Wrapper for elasticsearch bulk method
 * @type {Function}
 * @param {String} index - Index name.yml
 * @param {Object} list - Array with bulk actions
 * @param {Function} cb - Callback function from the calling method
 */
module.exports.bulk = function(index, list, cb) {

    var actions = list.length / 2;
    logger.info('*** start bulk update transaction for index ' + index + ' with ' + actions + ' actions');

    async.series([
            //testConnection,
            function(callback) {
                var input = '';

                // modify to list info to the needed input
                switch (typeof list) {
                    case 'object':
                        list.forEach(function(item){
                            input += JSON.stringify(item) + '\n';
                        });
                        break;
                    default:
                        input = list;
                }

                // submit request to the elasticsearch client
                logger.info('*** submitting bulk request to elasticsearch for index ' + index + ' with ' + actions + ' actions');
                client.bulk({
                    body: input
                }, function(err, result) {
                    if (err) {
                        logger.info('*** error processing bulk request for index ' + index + ' with ' + actions + ' actions: ' + err);
                        callback(err);
                    } else {
                        logger.info('*** processed bulk request for index ' + index + ' with ' + actions + ' actions. Processed: ' + result.items.length + ' Errors: ' + result.errors);
                        callback(null, result);
                    }
                });
            }
        ],
        function(err, result) {
            if (typeof cb === 'function') {
                if (err) {
                    cb(err);
                } else {
                    cb(null, result);
                }
            }
        }
    );
};

/**
 * Wrapper for elasticsearch count all documents across indices method.
 * @type {Function}
 * @param {Function} cb - Callback function from the calling method
 */
// not used yet
module.exports.countAllDocuments = function(cb) {

    client.count(function(err, response, status) {
        if (typeof cb === 'function') {
            cb(err, response.count);
        } else {
            return err ? err : response.count;
        }
    });
};

/**
 * Wrapper for elasticsearch count all documents in an index method.
 * @type {Function}
 * @param {Function} index - Elasticsearch Index
 * @param {Function} cb - Callback function from the calling method
 */
// not used yet
module.exports.countDocumentsInIndex = function(index, cb) {

    client.count({
        index: index
    }, function(err, result) {
            if (err) {
                cb(err);
            } else {
                cb(null, result);
            }
        }
    );
};

/**
 * Wrapper for elasticsearch delete index method.
 * @type {Function}
 * @param {String} index - Index to be deleted
 * @param {Function} cb - Callback function from the calling method
 */
module.exports.deleteIndex = function(index, cb) {

    var idx = index.toString().toLowerCase();
    logger.info('*** start transaction deleting index ' + idx);

    async.series([
        //testConnection,
        function(callback) {
            logger.info('*** checking index if ' + idx + ' exists');
            client.indices.exists({
                    index: idx
                }, function (err, result) {
                    if (err) {
                        callback(err, result);
                    } else if (!result) {
                        // report as 'error' to stop the series as there's no need to delete the index
                        callback('index ' + idx + ' doesn\'t exist. No need to delete', result);
                    } else {
                        callback(null);
                    }
                }
            );
        },
        function(callback){
            logger.info('*** deleting index ' + idx);
            client.indices.delete({
                    index: idx,
                    ignoreUnavailable: true
                }, function (err, result) {
                    if (err) {
                        callback(err, result);
                    } else {
                        callback(null, result);
                    }
                }
            );
        }
    ],
    function(err, result) {
        if (typeof cb === 'function') {

            // move index doesn't exist error to result (implemented so that source async series doesn't stop)
            if (err && err.toString().substring(0, 5) === 'index') {
                result = err;
                err = false;
            }

            // log results
            if (err) {
                logger.error(err);
            } else {
                if (typeof result === 'object') {
                    var ack = _.find(result, 'acknowledged');
                    if (ack) {
                        logger.info('*** index ' + idx + ' deleted: ' + ack.acknowledged);
                    }
                } else {
                    logger.info('*** index ' + idx + ' doesn\'t exist. No need to delete');
                }
            }

            // execute callback
            cb(err, result);
        }
    });
};

// not used yet
module.exports.createIndexMapping = function(index, cb) {

    for (var i=0; i < index.length; i++) {

        // the dataType file to load
        var indexName = index[i].indexDefinition.index;
        var indexType = index[i].indexDefinition.type;
        var file = './config/dataMapping/' +  indexName + '/' + indexType + '/generic.yml';

        // process the loaded dateType file
        // TODO: not finished
        var createIndexMapping = function(err, dataTypes) {
            if (err) {
                // that's a problem
            } else {
                // only non-string data types are defined in dataMapping.
                // so we need to create a json that has all the fields from index[i] with type string
                // and then override with the details from dataMapping
                var str = '\{\"' + index[i].indexDefinition.index.toString().toLowerCase() + '\"\:\{\"';
                str += index[i].indexDefinition.type.toString().toLowerCase() + '\"\:\{\"properties\":{}}}}';
                var jsonObj = JSON.parse(str);

                // add each of the mapping fields
                for (var prop in index[i]) {
                    switch (prop) {
                        case 'indexDefinition':
                            // ignore
                            break;
                        default:
                            if (typeof prop === 'object') {
                                // we're dealing with a sub array
                            } else {
                                var obj = {
                                    type: 'string'
                                };
                                jsonObj[index[i].indexDefinition.index][index[i].indexDefinition.type]['properties'][prop] = obj;
                            }
                    }
                }
            }
            cb();
        };

        // load the dataType file
        mapping.loadFile(file, createIndexMapping);
    }
};