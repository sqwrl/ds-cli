/**
 *  Created by sqwrl on 7/30/15.
 */

/**
 * Initialize.
 */
'use strict';

/**
 * Migrate the data from source database to elasticsearch
 * @type {Function}
 * @param {Object} options - Contains the options as specified with the command line
 * @param {String} options.sourceSystem - Valid options are specified in default.yml sourceSystem
 * @param {String} options.version - Valid options are specified in default.yml version[sourceSystem]
 * @param {String} options.subSystem - A string with comma delimited list of sub systems to migrate
 */
module.exports = function(options) {

    /**
    * Initialize
    * */
    var async       = require('async'),
        db          = require('./database'),
        es          = require('./elasticsearch'),
        logger      = global.logger,
        config      = require('config'),
        _           = require('lodash'),
        useTestData = true;
        require('./codes').generateCodes(useTestData);


    /**
    * Transform data into documents
    */

    // Loop through each subsystem and create documents
    var ss = options.subSystem; //array of subsystems
    var map = global.schemaMap;

    async.eachSeries(ss, function(mapEntry, callback) {

        // loop through each sub system
        async.series([
            function(callback){
                es.deleteIndex(mapEntry, function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null);
                    }
                });
            },
            function(callback){
                es.createIndexMapping(mapEntry, function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null);
                    }
                });
            },
            function(callback){
                // loop through the indices
                var bulkRequestsIssued = 0;
                var bulkRequestsCompleted = 0;
                for (var i=0; i < map[mapEntry].length; i++) {

                    // set the index properties
                    var indexInfo = map[mapEntry][i];
                    var indexName = indexInfo.index.toLowerCase();
                    var indexType = indexInfo.type;
                    var indexIdField = {
                        field: indexInfo.params.id,
                        text: _.findKey(indexInfo.doc, { field: indexInfo.params.id })
                    };
                    var params = indexInfo.params;
                    var list = [], nestedList = [], nested = [];
                    var document = map[mapEntry][i].doc;
                    var isNested = false, nestedStarted = false;

                    var processData = function(params, document, isNested, whereIdIn, cb) {

                        // check chunkSize setting in map file and take that or from config.database.target.chunkSize
                        var chunkSize = (params.chunkSize) ? (params.chunkSize) : config.database.target.chunkSize;
                        logger.info('*** chunkSize: ' + chunkSize);

                        var recCount = db.count(
                            _.clone(params),  // the query info
                            whereIdIn, // list with ids
                            useTestData // boolean whether to use test data
                        );
                        var chunks = (recCount % chunkSize === 0) ? recCount / chunkSize : Math.floor(recCount / chunkSize) + 1;

                        for (var c = 0; c < chunks; c++) {

                            var recs = [];

                            // get the records in chunks
                            recs = db.query(
                                _.clone(params),  // the query info
                                c, // which record to start
                                chunkSize, // the next number of records
                                whereIdIn, // list of ids
                                useTestData // boolean whether to use test data
                            );

                            if (!isNested) {
                                var idlist = _.pluck(recs, params.id);
                                var idList = '';
                                for (var value = 0; value < idlist.length; value++) {
                                    if (value !== idlist.length - 1) {
                                        idList += "\'" + idlist[value] + "\'\,";
                                    } else {
                                        idList += "\'" + idlist[value] + "\'";
                                    }
                                }
                            }

                            // loop through the dataset and create documents
                            for (var r = 0; r < recs.length; r++) {
                                var prop;
                                var doc = {};

                                // set the action summary
                                if (!isNested) {
                                    for (prop in document) {
                                        if (document.hasOwnProperty(prop) && document[prop].hasOwnProperty('field')) {
                                            if (document[prop].field === params.id) {
                                                list.push({
                                                    'index': {
                                                        '_index': indexName,
                                                        '_type': indexType,
                                                        '_id': recs[r][document[prop].field]
                                                    }
                                                });
                                            }
                                        }
                                    }
                                }

                                // create the document
                                for (prop in document) {
                                    if (document.hasOwnProperty(prop) && document[prop].hasOwnProperty('type')) {
                                        if (document[prop].type === 'nested') {
                                            // This is a nested document for which we need to do the same as the main document.
                                            // Capture the nested objects for now. We'll add the data in later
                                            if (!isNested && r === 0) {
                                                nested.push({
                                                    field: prop,
                                                    doc: document[prop]
                                                });
                                            }
                                        } else {
                                            if (document[prop].hasOwnProperty('code')) {
                                                if (recs[r][document[prop].field] !== '' && recs[r][document[prop].field] !== null) {
                                                    var strCode = recs[r][document[prop].field] + ' - ';
                                                    var where = document[prop].code[_.keysIn(document[prop].code)[0]];
                                                    if (document[prop].code.where) {
                                                        for (var d = 0; d < document[prop].code.where.length; d++) {
                                                            var field = document[prop].code.where[d];
                                                            if (field.substring(0, 1) === '$') {
                                                                where += '.' + field.substr(1);
                                                            } else {
                                                                where += '.' + recs[r][document[field].field];
                                                            }
                                                        }
                                                    }
                                                    where += '.' + recs[r][document[prop].field];
                                                    strCode += _.get(global.ds.codes, where);
                                                    doc[prop] = strCode;
                                                } else {
                                                    doc[prop] = recs[r][document[prop].field];
                                                }
                                            } else {
                                                doc[prop] = recs[r][document[prop].field];
                                            }
                                        }
                                    }
                                }

                                // add the document to the list
                                if (isNested) {
                                    var searchObject = JSON.parse('{"' + indexIdField.text + '":"' + doc[indexIdField.text] + '"}' );
                                    var target = _.find(list, searchObject );
                                    if (!target.hasOwnProperty(nestedList[0])) {
                                        target[nestedList[0]] = [];
                                    }
                                    logger.info(doc, '*** adding nested doc to ' + nestedList[0]);
                                    target[nestedList[0]].push(_.clone(doc, true));
                                } else {
                                    list.push(_.clone(doc, true));
                                }
                                doc = {};
                            }

                            // Now process any nested documents
                            if (!isNested && !nestedStarted) {
                                nestedStarted = true;
                                async.each(nested, function(nestedDoc, cb) {
                                    nestedList = []; nestedList.push(nestedDoc.field);
                                    logger.info('*** start processing nested document: ' + nestedList[0]);
                                    processData(nestedDoc.doc.params, nestedDoc.doc.doc, true, idList, cb);
                                },
                                function(err) {
                                    if (err) {
                                        logger.error(err, '*** ERROR processing nested document ' + nestedList[0]);
                                    }
                                });

                            } else {
                                if (cb && typeof cb === 'function') {
                                    cb(null, 'done');
                                }
                            }

                            // Do a bulk update
                            if (!isNested) {
                                var bulk = list;
                                list = [];

                                //post to elastic search
                                var logResult = function (err, result) {
                                    bulkRequestsCompleted++;
                                    logger.info('*** bulk requests #: ' + bulkRequestsCompleted + ' of ' + bulkRequestsIssued + ' for index ' + indexName + '/' + indexType + ' completed');
                                    if (err) {
                                        callback(err, result);
                                    } else {
                                        if (bulkRequestsIssued === bulkRequestsCompleted) {
                                            callback(null, result);
                                        }
                                    }
                                };

                                // track the number of bulk requests
                                bulkRequestsIssued++;
                                logger.info('*** bulk request #' + bulkRequestsIssued + ' for index ' + indexName + '/' + indexType + ' submitted');

                                // issue the bulk request
                                es.bulk(indexName + '/' + indexType, bulk, logResult);
                            }
                        }
                    };

                    // process the main document chunk
                    if (!isNested) {
                        processData(params, document, false, null);
                    }

                }
            }
        ], function(err, result){
            if (err) {
                callback(err, result);
            } else {
                callback(null, result);
            }
        });
    }, function(err) {
        if (err) {
            logger.error(err);
        }
    });
};