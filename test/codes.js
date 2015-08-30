/**
 * Created by sqwrl on 8/29/15.
 */

var _   = require('lodash');

(function() {
    if (!global.hasOwnProperty('ds')) global.ds = {};
    var codes = global.ds.codes = {};


    // general ledger
    _.set(codes, 'glLedger.GL', 'General Ledger');
    _.set(codes, 'glLedger.SL', 'Subsidiary Ledger');

    // pe master codes
    _.set(codes, 'pePeMasterStatus.A', 'Active');
    _.set(codes, 'peMasterStatus.I', 'Inactive');
    _.set(codes, 'peSecurityCode.SEC', 'General Security');
    _.set(codes, 'peSelectCode1.SC1', 'Security Code 1');
    _.set(codes, 'peSelectCode1.SC2', 'Security Code 2');
    _.set(codes, 'peSelectCode2.ABC', 'ABC Code');
    _.set(codes, 'peAffiliateCode.AF1', 'Affiliate 1');

    // product codes
    _.set(codes, 'peProductStatus.GL.A', 'Active');
    _.set(codes, 'peProductStatus.GL.I', 'Inactive');
    _.set(codes, 'peProductStatus.SL.A', 'Active');
    _.set(codes, 'peProductStatus.SL.I', 'Insufficient');

    // hr codes
    _.set(codes, 'hrEntity.ROOT', 'Root Entity');
    _.set(codes, 'hrEmployeeStatus.ROOT.A', 'Active');
    _.set(codes, 'hrEmployeeStatus.ROOT.I', 'Inactive');
    _.set(codes, 'hrEmployeeStatus.ROOT.L', 'Leave');
    _.set(codes, 'hrPYStatus.A', 'Active');
    _.set(codes, 'hrPYStatus.I', 'Inctive');
    _.set(codes, 'hrEmployeeType.ROOT.ABC', 'Abc Type');
    _.set(codes, 'hrEmployeeType.ROOT.CERT', 'Certificated');
    _.set(codes, 'hrEmployeeType.ROOT.QWE', 'Q.W.E. Status');
    _.set(codes, 'hrBargUnit.ROOT.DEF', 'Definitive Unit');
    _.set(codes, 'hrBargUnit.ROOT.NONE', 'No Unit');
    _.set(codes, 'hrBargUnit.ROOT.GRA', 'Graphics Unit');
    _.set(codes, 'hrDivision.ROOT.FIN', 'Finance');
    _.set(codes, 'hrDepartment.ROOT.ADMIN', 'General Admin');
    _.set(codes, 'hrDepartment.ROOT.FACT', 'Faculty');
})();