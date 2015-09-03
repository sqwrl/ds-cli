/**
 * Created by sqwrl on 8/29/15.
 */

var _   = require('lodash');

(function() {
    if (!global.hasOwnProperty('ds')) global.ds = {};
    var codes = global.ds.codes = {};

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

})();