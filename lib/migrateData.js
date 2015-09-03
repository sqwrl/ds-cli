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
                    var list = [];
                    var document = map[mapEntry][i].doc;

                    // check chunkSize setting in map file and take that or from config.database.target.chunkSize
                    var chunkSize = (document.params.chunkSize) ? (document.params.chunkSize) : config.database.target.chunkSize;
                    logger.info('*** chunkSize: ' + chunkSize);

                    var recCount = db.count(
                        _.clone(document.params),  // the query info
                        null, // list with ids
                        useTestData // boolean whether to use test data
                    );
                    var chunks = (recCount % chunkSize === 0) ? recCount/chunkSize : Math.floor(recCount/chunkSize) + 1;

                    for (var c=0; c < chunks; c++) {

                        var recs = [];

                        // get the records in chunks
                        recs = db.query(
                            _.clone(document.params),  // the query info
                            c, // which record to start
                            chunkSize, // the next number of records
                            null, // list of ids
                            useTestData // boolean whether to use test data
                        );

                        var idlist = _.pluck(recs, document.params.id);
                        var idList = '';
                        for (var value=0; value < idlist.length; value++) {
                            if (value !== idlist.length - 1) {
                                idList += "\'" + idlist[value] + "\'\,";
                            } else {
                                idList += "\'" + idlist[value] + "\'";
                            }
                        }

                        // loop through the dataset and create documents
                        for (var r = 0; r < recs.length; r++) {
                            var prop;
                            var doc = {};

                            // set the action summary
                            for (prop in document) {
                                if (document[prop].field === document.params.id) {
                                    list.push({
                                        "index": {
                                            '_index': indexName,
                                            '_type': indexType,
                                            '_id': recs[r][document[prop].field]
                                        }
                                    });
                                }
                            }

                            // create the document
                            for (prop in document) {
                                switch (prop) {
                                    case 'params':
                                    case 'subDocs':
                                        //ignore
                                        break;
                                    default:
                                        if (document[prop].hasOwnProperty('code')) {
                                            if (recs[r][document[prop].field] !== '' && recs[r][document[prop].field] !== null) {
                                                var strCode = recs[r][document[prop].field] + ' - ';
                                                var where = document[prop].code[_.keysIn(document[prop].code)[0]];
                                                if (document[prop].code.where) {
                                                    for (var d = 0; d < document[prop].code.where.length; d++) {
                                                        var field = document[prop].code.where[d];
                                                        if (field.substring(0,1) === '$') {
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

                            // add the document to the list
                            list.push(_.clone(doc, true));
                            doc = {};
                        }

                        // we're done with a main document chunk (including the sub document(s)
                        // do a bulk update
                        var bulk = list;
                        list = [];

                        //post to elastic search
                        var logResult = function (err, result) {
                            bulkRequestsCompleted ++;
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
                        bulkRequestsIssued ++;
                        logger.info('*** bulk request #' + bulkRequestsIssued + ' for index ' + indexName + '/' + indexType + ' submitted');
                        
                        // issue the bulk request
                        es.bulk(indexName + '/' + indexType, bulk, logResult);
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