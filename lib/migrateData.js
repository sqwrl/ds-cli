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
                //TODO: cli param whether to delete or update index with latest changes
                es.deleteIndex(mapEntry, function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null);
                    }
                });
            },
            //function(callback){
            //    // create index mappings for all types in the subsystem
            //    es.createIndexMapping(map[mapEntry], function(err) {
            //        if (err) {
            //            callback(err);
            //        } else {
            //            callback(null);
            //        }
            //    });
            //},
            function(callback){
                // loop through the indices
                var bulkRequestsIssued = 0;
                var bulkRequestsCompleted = 0;
                for (var i=0; i < map[mapEntry].length; i++) {

                    // set the index properties
                    var indexInfo = map[mapEntry][i].indexDefinition;
                    var indexName = indexInfo.index.toLowerCase();
                    var indexType = indexInfo.type;
                    var list = [];
                    var document = map[mapEntry][i].doc;
                    var subList = [];

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
                            // TODO: don't assume it's a string
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
                                if (document[prop] === document.params.id) {
                                    list.push({
                                        "index": {
                                            '_index': indexName,
                                            '_type': indexType,
                                            '_id': recs[r][document[prop]]
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
                                        doc[prop] = recs[r][document[prop]];
                                }
                            }

                            // add the document to the list
                            list.push(_.clone(doc, true));
                            doc = {};
                        }

                        // now pull in the associated records from the subDocs node if one exists
                        var subDocs = map[mapEntry][i].subDocs || [];

                        for (var sd=0; sd < subDocs.length; sd++) {

                            // determine the chunkSize for these records
                            var chunkSubDocSize = (subDocs[sd].params.chunkSize) ? (subDocs[sd].params.chunkSize) : config.database.target.chunkSize;

                            // determine the # of records
                            var recSubDocCount = db.count(
                                _.clone(subDocs[sd].params),  // the query info
                                idList, // list with ids
                                useTestData // boolean whether to use test data
                            );
                            var chunksSubDoc = (recSubDocCount % chunkSubDocSize === 0) ? recSubDocCount/chunkSubDocSize : Math.floor(recSubDocCount/chunkSubDocSize) + 1;

                            for (var csd = 0; csd < chunksSubDoc; csd++) {

                                // get records in chunks
                                //var newQuerySub = subDocs[sd].params.query + ' ORDER BY ' + subDocs[sd].params.id + ' ASC WHERE ' + subDocs[sd].params.id + ' IN (' + idList + ')';
                                var recsSubDoc = db.query(
                                    _.clone(subDocs[sd].params),  // the query info
                                    csd, // which record to start
                                    chunkSubDocSize, // the next number of records
                                    idList, // list of ids
                                    useTestData // boolean whether to use test data
                                );

                                for (var rsd = 0; rsd < recsSubDoc.length; rsd++) {
                                    var propSubDoc;
                                    var subDoc = {};

                                    //for (prop in outline) {
                                    for (propSubDoc in subDocs[sd]) {
                                        switch (propSubDoc) {
                                            case 'params':
                                                // add the id to the subDoc
                                                subDoc.id = recsSubDoc[rsd][subDocs[sd].params.id];
                                                break;
                                            default:
                                                subDoc[propSubDoc] = recsSubDoc[rsd][subDocs[sd][propSubDoc]];
                                        }
                                    }

                                    // add the subdocument to the sublist
                                    subList.push(_.clone(subDoc, true));
                                    subDoc = {};
                                }
                            }

                            // done with this sub document
                            if (subList.length > 0) {
                                // group the list by id
                                var groupedByIdList = _.groupBy(subList, 'id');
                                subList = [];

                                _.forEach(groupedByIdList, function (n, id) {

                                    // remove the id property
                                    n.forEach(function (item) {
                                        delete item.id;
                                    });

                                    // find and update the document
                                    var docToUpdate = _.find(list, {'id': id});
                                    docToUpdate[subDocs[sd].params.nodeName] = n;
                                });
                            }
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