/**
 *  Created by sqwrl on 7/30/15.
 */

/**
 * Initialize.
 */
'use strict';
var sql         = require('mssql'),
    config      = require('config'),
    logger      = global.logger;

/**
 * Query Source Database
 * @type {Function}
 * @param {String} params - Query parameters
 * @param {Number} offSet - The record number to start fetching from
 * @param {Number} next - The number of records to fetch
 * @param {String} idList - The list with unique ids
 * @param {Boolean} test - Whether to return dummy data or execute the sql
 */
module.exports.query = function(
    params,
    offSet,
    next,
    idList,
    test
    ) {

    var recs = [];

    // TODO: formulate query based on source database type (MSSQL, Oracle, Informix)
    var newQuery = params.query;
    if (idList !== undefined && idList !== null) {
        newQuery += ' WHERE ' + params.id + ' IN (' + idList + ')';
    }
    newQuery += ' ORDER BY ' + params.orderBy + ' ASC OFFSET ' + offSet + ' ROWS FETCH NEXT ' + next + ' ROWS ONLY';
    params.query = newQuery;

    if (test) {
        // return mock data
        var data = require('../test/data');
        recs = data.getData(
            params,
            offSet,
            next,
            idList,
            false
        );

        return recs;
    }

    /**
     * Setup the MS SQL Server Connection
     */
    var connectConfig = {
        user: config.database.source.user,
        password: config.database.source.password,
        server: config.database.source.server,
        database: config.database.source.database
    };

    var connection = new sql.Connection(connectConfig, function(err) {
        if (err) {
            logger.error(err);
        } else {
            var request = new sql.Request(connection);
            request.query(newQuery, function(err, recs) {
                connection.close();
                if (err) {
                    logger.error(err);
                    return [];
                } else {
                    return recs;
                }
            })
        }
    });
};

/**
 * Count records in the Source Database
 * @type {Function}
 * @param {String} params - Query parameters
 * @param {String} idList - List of ids to retrieve
 * @param {Boolean} test - Return test data
 */
module.exports.count = function(
    params,
    idList,
    test
    ) {

    var recCount = 0;

    var countQuery = params.query.replace('*', 'count(' + params.id + ')');
    if (idList !== undefined && idList !== null) {
        countQuery += ' WHERE ' + params.id + ' IN (' + idList + ')';
    }
    params.query = countQuery;

    if (test) {
        // return mock data
        var data = require('../test/data');
        recCount = data.getData(
            params, // query parameters
            null, // starting record to fetch from
            null, // number of records to fetch
            idList, // list with ids
            true // use test data
        );

        return recCount;
    }

    /**
     * Setup the MS SQL Server Connection
     */
    var connectConfig = {
        user: config.database.source.user,
        password: config.database.source.password,
        server: config.database.source.server,
        database: config.database.source.database
    };

    var connection = new sql.Connection(connectConfig, function(err) {
        if (err) {
            logger.error(err);
        } else {
            var request = new sql.Request(connection);
            request.query(countQuery, function(err, recCount) {
                connection.close();
                if (err) {
                    logger.error(err);
                    return 0;
                } else {
                    return recCount;
                }
            })
        }
    });
};