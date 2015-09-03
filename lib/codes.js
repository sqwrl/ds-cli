/**
 *  Created by sqwrl on 8/29/15.
 */

/**
 * Initialize.
 */
var db          = require('./database'),
    logger      = global.logger,
    _           = require('lodash'),
    useTestData = true;

if (!global.hasOwnProperty('ds')) global.ds = {};
var codes = global.ds.codes = {};

/**
 * generate the system and configured codes and their descriptions
 * @type {Function}
 */
module.exports.generateCodes = function() {
    getsetGLCodes();
    getsetPECodes();
    getsetHRCodes();
};

function getsetGLCodes() {
    var recs = db.query(
        {
            query: 'SELECT gl_gr, glg_desc FROM glg_gen_mstr',
            id: '',
            orderBy: 'gl_gr'
        },
        0, // which record to start
        null, // the next number of records
        null, // list of ids
        useTestData // boolean whether to use test data
    );
    logger.debug(recs, 'getsetGLCodes records');

    for (var r=0; r < recs.length; r++) {
        _.set(codes, 'glLedger.' + recs[r].gl_gr, recs[r].glg_desc);
    }
}

function getsetPECodes() {

    // pe common codes
    var recs = db.query(
        {
            query: 'SELECT cd_gr, cd_category, cd_code, cd_descs, cd_descm, cd_descl FROM cd_codes_mstr WHERE LEFT(cd_category,2)="PE"',
            id: '',
            orderBy: 'cd_category, cd_gr'
        },
        0, // which record to start
        null, // the next number of records
        null, // list of ids
        useTestData // boolean whether to use test data
    );
    logger.debug(recs, 'getsetPECodes:cd_codes_mstr records');

    for (var r=0; r < recs.length; r++) {
        var codeType;
        var text = '';
        switch (recs[r].cd_category) {
            case 'PEOW':
                codeType = 'peCommonCodes';
                text = recs[r].cd_descm;
                break;
        }

        _.set(codes, codeType + '.' + recs[r].cd_category + '.' + recs[r].cd_code, text);
    }

    // pe status codes
    _.set(codes, 'pePeMasterStatus.AC', 'Active');
    _.set(codes, 'pePeMasterStatus.IN', 'Inactive');
    _.set(codes, 'pePeMasterStatus.PN', 'Pending');

    // pe product codes
    _.set(codes, 'peProductStatus.AC', 'Active');
    _.set(codes, 'peProductStatus.IN', 'Inactive');
    _.set(codes, 'peProductStatus.OB', 'Obsolete');

}

function getsetHRCodes() {
    var codeType;

    // hr entity codes
    var recs = db.query(
        {
            query: 'SELECT entity_cd, short_desc, long_desc FROM hr_entytble',
            id: '',
            orderBy: 'entity_cd'
        },
        0, // which record to start
        null, // the next number of records
        null, // list of ids
        useTestData // boolean whether to use test data
    );
    logger.debug(recs, 'getsetHRCodes:hr_entytble records');


    for (var r=0; r < recs.length; r++) {
        _.set(codes, 'hrEntity.' + recs[r].entity_cd, recs[r].long_desc);
    }

    // hr non-entity codes
    recs = db.query(
        {
            query: 'SELECT codeid, codeval, short_desc, long_desc FROM hr_hrcode',
            id: '',
            orderBy: 'codeid'
        },
        0, // which record to start
        null, // the next number of records
        null, // list of ids
        useTestData // boolean whether to use test data
    );
    logger.debug(recs, 'getsetHRCodes:hr_hrcode records');


    for (r=0; r < recs.length; r++) {

        switch (recs[r].codeid) {
            case 'GENDER_CODE':
                codeType = 'hrEmployeeGender';
                break;
            case 'HR_EMPLOYEE_STAT':
                codeType = 'hrHRStatus';
                break;
            case 'PY_EMPLOYEE_STAT':
                codeType = 'hrPYStatus';
                break;
        }
        _.set(codes, codeType + '.' + recs[r].codeval, recs[r].long_desc);
    }

    // hr entity-specific codes
    recs = db.query(
        {
            query: 'SELECT entity_id, codeid, codeval, short_desc, long_desc FROM hr_hrencode',
            id: '',
            orderBy: 'entity_id, codeid'
        },
        0, // which record to start
        null, // the next number of records
        null, // list of ids
        useTestData // boolean whether to use test data
    );
    logger.debug(recs, 'getsetHRCodes:hr_hrencode records');


    for (r=0; r < recs.length; r++) {
        switch (recs[r].codeid) {
            case 'DEPARTMENT_CODE':
                codeType = 'hrDepartment';
                break;
            case 'DIVISION_CODE':
                codeType = 'hrDivision';
                break;
            case 'EMPLOYEE_TYPE':
                codeType = 'hrEmployeeType';
                break;
        }
        _.set(codes, codeType + '.' + recs[r].entity_id + '.' + recs[r].codeval, recs[r].long_desc);
    }

    // hr location codes
    recs = db.query(
        {
            query: 'SELECT entity_id, location, short_desc, long_desc FROM hr_loctble',
            id: '',
            orderBy: 'entity_id, location'
        },
        0, // which record to start
        null, // the next number of records
        null, // list of ids
        useTestData // boolean whether to use test data
    );
    logger.debug(recs, 'getsetHRCodes:hr_loctble records');


    for (r=0; r < recs.length; r++) {
        _.set(codes, 'hrLocation.' + recs[r].entity_id + '.' + recs[r].location, recs[r].long_desc);
    }

    // hr bargaining unit codes
    recs = db.query(
        {
            query: 'SELECT entity_id, bargunit, short_desc, long_desc FROM hr_bargtble',
            id: '',
            orderBy: 'entity_id, location'
        },
        0, // which record to start
        null, // the next number of records
        null, // list of ids
        useTestData // boolean whether to use test data
    );
    logger.debug(recs, 'getsetHRCodes:hr_bargtble records');


    for (r=0; r < recs.length; r++) {
        _.set(codes, 'hrBargUnit.' + recs[r].entity_id + '.' + recs[r].bargunit, recs[r].long_desc);
    }

    //_.set(codes, 'hrEmployeeStatus.ROOT.A', 'Active');
    //_.set(codes, 'hrEmployeeStatus.ROOT.I', 'Inactive');
    //_.set(codes, 'hrEmployeeStatus.ROOT.L', 'Leave');
    //_.set(codes, 'hrPYStatus.A', 'Active');
    //_.set(codes, 'hrPYStatus.I', 'Inctive');
    //_.set(codes, 'hrEmployeeType.ROOT.ABC', 'Abc Type');
    //_.set(codes, 'hrEmployeeType.ROOT.CERT', 'Certificated');
    //_.set(codes, 'hrEmployeeType.ROOT.QWE', 'Q.W.E. Status');
    //_.set(codes, 'hrBargUnit.ROOT.DEF', 'Definitive Unit');
    //_.set(codes, 'hrBargUnit.ROOT.NONE', 'No Unit');
    //_.set(codes, 'hrBargUnit.ROOT.GRA', 'Graphics Unit');
    //_.set(codes, 'hrDivision.ROOT.FIN', 'Finance');
    //_.set(codes, 'hrDepartment.ROOT.ADMIN', 'General Admin');
    //_.set(codes, 'hrDepartment.ROOT.FACT', 'Faculty');

    logger.info(global.ds.codes);
}

