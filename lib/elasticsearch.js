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

    client.count(function(err, response) {
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


module.exports.createIndexMapping = function(ss, cb) {

    var index = global.schemaMap[ss];

    async.eachSeries(
        index,
        function(index, callback) {

            var defaults = config.esMappingDefaults;
            var properties = {};
            var meta = {};
            meta['index'] = {
                id: index.index,
                text: index.indexText
            };
            meta['type'] = {
                id: index.type,
                text: index.typeText
            };
            meta['fixedColumns'] = index.fixedColumns;

            // extract the mappings properties
            for (var field in index.doc) {
                if (field !== 'params') {

                    // generate the field mapping
                    var fieldInfo = index.doc[field];
                    var dflt = defaults[fieldInfo.type];
                    var obj = {
                        type: fieldInfo.type,
                        store: fieldInfo.store || dflt.store,
                        index: fieldInfo.index || dflt.index
                    };
                    if (fieldInfo.type === 'string') {
                        obj.analyzer = fieldInfo.analyzer || dflt.analyzer;
                        if (fieldInfo.facet) {
                            obj.fields = {
                                raw: {
                                    type: 'string',
                                    index: 'not_analyzed'
                                }
                            }
                        }
                    }
                    if (fieldInfo.type === 'date') {
                        obj.format = fieldInfo.format || dflt.format;
                    }

                    properties[field] = obj;

                    // generate the _meta information
                    meta[field] = {
                        text: fieldInfo.text,
                        type: fieldInfo.type,
                        facet: fieldInfo.facet || false
                    };
                }
            }

            // create the final object and submit mapping to elasticsearch
            var indexName = index.index;
            var indexType = index.type;
            var mapping = JSON.parse('{\"' + index.type + '\": { \"properties\":' + JSON.stringify(properties) + '}}');
            mapping[index.type]._meta = meta;

            client.indices.exists({
                index: indexName
            }, function(err, exists) {
                if (err) {
                    logger.error('*** ERROR checking if index ' + indexName + ' exists: ' + err);
                    callback(err, exists);
                } else {
                    if (exists) {
                        client.indices.putMapping({
                            index: indexName,
                            type: indexType,
                            body: mapping
                        }, function (err, res) {
                            logger.info('*** submitted mapping for index ' + indexName + '/' + indexType + ': error: ' + err + '| response: ' + JSON.stringify(res));
                            callback(err, res);
                        });
                    } else {
                        client.indices.create({
                            index: indexName
                        }, function (err, res) {
                            if (err) {
                                logger.error('*** ERROR creating index ' + indexName + '/' + indexType + ': ' + err);
                                callback(err, res);
                            } else {
                                logger.info('*** created index ' + indexName + '/' + indexType);
                                client.indices.putMapping({
                                    index: indexName,
                                    type: indexType,
                                    body: mapping
                                }, function (err, res) {
                                    logger.info('*** submitted mapping for index ' + indexName + '/' + indexType + ': error: ' + err + '| response: ' + JSON.stringify(res));
                                    callback(err, res);
                                });
                            }
                        });
                    }
                }
            });
        },
        function(err, result) {
            cb(err, result);
        }
    )
};

