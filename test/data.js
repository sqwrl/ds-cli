/**
 * Created by sqwrl on 8/1/15.
 */

'use strict';
var _   = require('lodash');

module.exports.getData = function(
    params, // query parameters
    offSet, // record number to start fetching from
    next, // number of records to fetch
    idList, // list with ids
    count // whether to count the records only (complete recordset)
    ) {

    // return mock data
    var recs = [];
    var q = params.query.substring(0,50);
    switch (q) {
        case 'SELECT count(pe_name_mstr.pe_id) FROM pe_name_mstr':
        case 'SELECT * FROM pe_name_mstr ORDER BY pe_name_mstr.u':
            recs = [
                {
                    'pe_name_mstr.pe_id': '1000',
                    'pe_name_mstr.pe_id_status': 'A',
                    'pe_name_mstr.name': 'LAST1 FIRST1, MIDDLE1',
                    'pe_name_mstr.name_first': 'First1',
                    'pe_name_mstr.name_middle': 'Middle1',
                    'pe_name_mstr.name_last': 'Last1',
                    'pe_name_mstr.pe_url': '',
                    'pe_name_mstr.security_cd': 'SEC',
                    'pe_name_mstr.pe_sel_cd1': 'SC1',
                    'pe_name_mstr.pe_sel_cd2': '',
                    'pe_name_mstr.affil_cd': 'AF1',
                    'pe_name_mstr.update_when': '12/12/2012',
                    'pe_name_mstr.unique_id': 1,
                    'pe_name_mstr.unique_key': 'key1',
                    'pe_name_mstr.extra_field1': 'Extra Field 1',
                    'pe_name_mstr.extra_field3': 'Extra Field 3'
                },
                {
                    'pe_name_mstr.pe_id': '2000',
                    'pe_name_mstr.pe_id_status': 'A',
                    'pe_name_mstr.name': 'LAST2 FIRST2',
                    'pe_name_mstr.name_first': 'First2',
                    'pe_name_mstr.name_middle': '',
                    'pe_name_mstr.name_last': 'Last2',
                    'pe_name_mstr.pe_url': 'www.someurl.com',
                    'pe_name_mstr.security_cd': 'SEC',
                    'pe_name_mstr.pe_sel_cd1': 'SC2',
                    'pe_name_mstr.pe_sel_cd2': 'ABC',
                    'pe_name_mstr.affil_cd': '',
                    'pe_name_mstr.update_when': '11/11/2011',
                    'pe_name_mstr.unique_id': 2,
                    'pe_name_mstr.unique_key': 'key2',
                    'pe_name_mstr.extra_field1': 'Extra Field 1',
                    'pe_name_mstr.extra_field3': 'Extra Field 3'
                }
            ];
            break;
        case "SELECT count(pe_email_dtl.pe_id) FROM pe_email_dtl":
        case "SELECT * FROM pe_email_dtl INNER JOIN pe_name_mstr":
            recs = [
                {
                    'pe_email_dtl.pe_id': '1000',
                    'pe_email_dtl.email_type_cd': 'HO',
                    'pe_email_dtl.pe_addr_cd': 'PM',
                    'pe_email_dtl.email_addr': 'email@1000.1',
                    'pe_email_dtl.url': 'www.emailkey1.com',
                    'pe_email_dtl.update_when': '10/10/2010',
                    'pe_email_dtl.unique_id': 2,
                    'pe_email_dtl.unique_key': 'EmailKey1'
                },
                {
                    'pe_email_dtl.pe_id': '1000',
                    'pe_email_dtl.email_type_cd': 'OF',
                    'pe_email_dtl.pe_addr_cd': 'PM',
                    'pe_email_dtl.email_addr': 'emailoffice@1000.1',
                    'pe_email_dtl.url': 'www.emailkey2.com',
                    'pe_email_dtl.update_when': '9/10/2010',
                    'pe_email_dtl.unique_id': 1,
                    'pe_email_dtl.unique_key': 'EmailKey2'
                },
                {
                    'pe_email_dtl.pe_id': '2000',
                    'pe_email_dtl.email_type_cd': '',
                    'pe_email_dtl.pe_addr_cd': 'OF',
                    'pe_email_dtl.email_addr': 'email@2000.1',
                    'pe_email_dtl.url': 'www.emailkey3.com',
                    'pe_email_dtl.update_when': '8/8/2008',
                    'pe_email_dtl.unique_id': 3,
                    'pe_email_dtl.unique_key': 'EmailKey3'
                },
                {
                    'pe_email_dtl.pe_id': '2000',
                    'pe_email_dtl.email_type_cd': 'HO',
                    'pe_email_dtl.pe_addr_cd': 'OF',
                    'pe_email_dtl.email_addr': 'emailelse@2000.1',
                    'pe_email_dtl.url': 'www.emailkey4.com',
                    'pe_email_dtl.update_when': '7/7/2010',
                    'pe_email_dtl.unique_id': 4,
                    'pe_email_dtl.unique_key': 'EmailKey14'
                },
                {
                    'pe_email_dtl.pe_id': '2000',
                    'pe_email_dtl.email_type_cd': '',
                    'pe_email_dtl.pe_addr_cd': '',
                    'pe_email_dtl.email_addr': 'emailagain@2000.com',
                    'pe_email_dtl.update_when': '10/10/2010',
                    'pe_email_dtl.url': 'www.emailkey5.com',
                    'pe_email_dtl.unique_id': 5,
                    'pe_email_dtl.unique_key': 'EmailKey5'
                }
            ];
            break;
        case "SELECT count(pe_address_dtl.pe_id) FROM pe_address":
        case "SELECT * FROM pe_address_dtl INNER JOIN pe_name_ms":
            recs = [
                {
                    'pe_address_dtl.pe_id': '1000',
                    'pe_address_dtl.pe_addr_cd': 'HO',
                    'pe_address_dtl.st1': '11 Main',
                    'pe_address_dtl.city': 'Chico',
                    'pe_address_dtl.state': 'CA',
                    'pe_address_dtl.zip': '95928',
                    'pe_address_dtl.update_when': '10/10/2010',
                    'pe_address_dtl.unique_id': 1,
                    'pe_address_dtl.unique_key': 'AddressKey1'
                },
                {
                    'pe_address_dtl.pe_id': '2000',
                    'pe_address_dtl.pe_addr_cd': 'HO',
                    'pe_address_dtl.st1': '22 Main',
                    'pe_address_dtl.city': 'Chico',
                    'pe_address_dtl.state': 'CA',
                    'pe_address_dtl.zip': '95922',
                    'pe_address_dtl.update_when': '10/10/2010',
                    'pe_address_dtl.unique_id': 10,
                    'pe_address_dtl.unique_key': 'AddressKey2'
                },
                {
                    'pe_address_dtl.pe_id': '2000',
                    'pe_address_dtl.pe_addr_cd': 'OF',
                    'pe_address_dtl.st1': '33 Main',
                    'pe_address_dtl.city': 'Chico',
                    'pe_address_dtl.state': 'CA',
                    'pe_address_dtl.zip': '95933',
                    'pe_address_dtl.update_when': '10/10/2010',
                    'pe_address_dtl.unique_id': 100,
                    'pe_address_dtl.unique_key': 'AddressKey3'
                }
            ];
            break;
        case 'SELECT count(pe_prod_mstr.pr_id) FROM pe_prod_mstr':
        case 'SELECT * FROM pe_prod_mstr ORDER BY pe_prod_mstr.u':
            recs = [
                {
                    'pe_prod_mstr.pr_id':'1234',
                    'pe_prod_mstr.pe_id':'1000',
                    'pe_prod_mstr.prod_status':'A',
                    'pe_prod_mstr.prod_title':'Product 1 Title',
                    'pe_prod_mstr.prod_desc':'Produtc 1 Description',
                    'pe_prod_mstr.update_when':'12/11/12',
                    'pe_prod_mstr.unique_id': 1,
                    'pe_prod_mstr.unique_key':'ProdKey1'
                },
                {
                    'pe_prod_mstr.pr_id':'1245',
                    'pe_prod_mstr.pe_id':'1000',
                    'pe_prod_mstr.prod_status':'A',
                    'pe_prod_mstr.prod_title':'Product 2 Title',
                    'pe_prod_mstr.prod_desc':'Producr 2 Description',
                    'pe_prod_mstr.update_when':'1/12/11',
                    'pe_prod_mstr.unique_id': 20,
                    'pe_prod_mstr.unique_key':'ProdKey2'
                },
                {
                    'pe_prod_mstr.pr_id':'1256',
                    'pe_prod_mstr.pe_id':'1000',
                    'pe_prod_mstr.prod_status':'I',
                    'pe_prod_mstr.prod_title':'Product 3 Title',
                    'pe_prod_mstr.prod_desc':'Product 3 Description',
                    'pe_prod_mstr.update_when':'9/1/14',
                    'pe_prod_mstr.unique_id': 200,
                    'pe_prod_mstr.unique_key':'ProdKey3'
                },
                {
                    'pe_prod_mstr.pr_id':'2367',
                    'pe_prod_mstr.pe_id':'1000',
                    'pe_prod_mstr.prod_status':'A',
                    'pe_prod_mstr.prod_title':'Product 4 Title',
                    'pe_prod_mstr.prod_desc':'Product 4 Description',
                    'pe_prod_mstr.update_when':'3/1/12',
                    'pe_prod_mstr.unique_id': 400,
                    'pe_prod_mstr.unique_key':'ProdKey4'
                },
                {
                    'pe_prod_mstr.pr_id':'2378',
                    'pe_prod_mstr.pe_id':'1000',
                    'pe_prod_mstr.prod_status':'I',
                    'pe_prod_mstr.prod_title':'Product 5 Title',
                    'pe_prod_mstr.prod_desc':'Product 5 Description',
                    'pe_prod_mstr.update_when':'31/5/11',
                    'pe_prod_mstr.unique_id': 600,
                    'pe_prod_mstr.unique_key':'ProdKey5'
                }
            ];

            // add 250 records for pe_id 2000
            for (var i=0; i<250; i++){
                recs.push(
                    {
                        'pe_prod_mstr.pr_id':(3000 + (i*10)).toString(),
                        'pe_prod_mstr.pe_id':'2000',
                        'pe_prod_mstr.prod_status': (i % 30 === 0) ? 'I' : 'A',
                        'pe_prod_mstr.prod_title':'Product ' + i + ' Title',
                        'pe_prod_mstr.prod_desc':'Product ' + i + ' Description',
                        'pe_prod_mstr.update_when':'4/2/14',
                        'pe_prod_mstr.unique_id': 5 * i,
                        'pe_prod_mstr.unique_key':'2000ProdKey' + i
                    }
                )
            }
            break;
        case 'SELECT count(hr_empmstr.id) FROM hr_empmstr':
        case 'SELECT * FROM hr_empmstr ORDER BY hr_empmstr.uniqu':
            recs = [
                {
                    'hr_empmstr.id': 'AB100',
                    'hr_empmstr.status': 'A',
                    'hr_empmstr.py_stat': 'A',
                    'hr_empmstr.name': 'LAST1, FIRST1 MIDDLE1',
                    'hr_empmstr.fname': 'FIRST1',
                    'hr_empmstr.mname': 'MIDDLE1',
                    'hr_empmstr.lname': 'LAST1',
                    'hr_empmstr.type': 'ABC',
                    'hr_empmstr.barg_unit': 'DEF',
                    'hr_empmstr.division': '',
                    'hr_empmstr.dept': 'ADMIN',
                    'hr_empmstr.dob': '10/23/1970',
                    'hr_empmstr.hdt': '01/01/2000',
                    'hr_empmstr.update_when': '3/6/12',
                    'hr_empmstr.unique_key': 'EmpKey1',
                    'hr_empmstr.unique_id': 10,
                    'hr_empmstr.extra_field4': 'Extra Field 4'
                },
                {
                    'hr_empmstr.id': 'AB200',
                    'hr_empmstr.status': 'A',
                    'hr_empmstr.py_stat': 'A',
                    'hr_empmstr.name': 'LAST2, FIRST2 MIDDLE2',
                    'hr_empmstr.fname': 'FIRST2',
                    'hr_empmstr.mname': 'MIDDLE2',
                    'hr_empmstr.lname': 'LAST2',
                    'hr_empmstr.type': 'ABC',
                    'hr_empmstr.barg_unit': 'NONE',
                    'hr_empmstr.division': 'FIN',
                    'hr_empmstr.dept': 'ADMIN',
                    'hr_empmstr.dob': '11/2/1965',
                    'hr_empmstr.hdt': '12/11/2008',
                    'hr_empmstr.update_when': '3/6/13',
                    'hr_empmstr.unique_key': 'EmpKey2',
                    'hr_empmstr.unique_id': 200,
                    'hr_empmstr.extra_field4': 'Extra Field 4'
                },
                {
                    'hr_empmstr.id': 'AB300',
                    'hr_empmstr.status': 'L',
                    'hr_empmstr.py_stat': 'A',
                    'hr_empmstr.name': 'LAST3, FIRST3',
                    'hr_empmstr.fname': 'FIRST3',
                    'hr_empmstr.mname': '',
                    'hr_empmstr.lname': 'LAST3',
                    'hr_empmstr.type': 'CERT',
                    'hr_empmstr.barg_unit': 'GRA',
                    'hr_empmstr.division': '',
                    'hr_empmstr.dept': 'FACT',
                    'hr_empmstr.dob': '4/2121994',
                    'hr_empmstr.hdt': '03/23/2040',
                    'hr_empmstr.update_when': '3/6/12',
                    'hr_empmstr.unique_key': 'EmpKey3',
                    'hr_empmstr.unique_id': 3000,
                    'hr_empmstr.extra_field4': 'Extra Field 4'
                },
                {
                    'hr_empmstr.id': 'AB400',
                    'hr_empmstr.status': 'I',
                    'hr_empmstr.py_stat': 'I',
                    'hr_empmstr.name': 'LAST4, FIRST4 MIDDLE4',
                    'hr_empmstr.fname': 'FIRST4',
                    'hr_empmstr.mname': 'MIDDLE4',
                    'hr_empmstr.lname': 'LAST4',
                    'hr_empmstr.type': 'QWE',
                    'hr_empmstr.barg_unit': 'DEF',
                    'hr_empmstr.division': 'FIN',
                    'hr_empmstr.dept': 'ADMIN',
                    'hr_empmstr.dob': '12/11/1963',
                    'hr_empmstr.hdt': '02/04/2004',
                    'hr_empmstr.update_when': '11/6/15',
                    'hr_empmstr.unique_key': 'EmpKey4',
                    'hr_empmstr.unique_id': 9000,
                    'hr_empmstr.extra_field4': 'Extra Field 4'
                }
            ];
            break;
        default:
            recs = [];
    }

    // limit by idList
    if (idList !== undefined && idList !== null) {

        // create closure with the id array as well as the unique id
        var ids = idList.replace(/\'/g, '').split(',');
        var pid = params.id;

        // select the records that have the same id
        recs = _.filter(recs, function(n){
            return (_.indexOf(ids, n[pid]) >= 0);
        });
    }

    if (count) {
        return recs.length;
    } else {
        // return the appropriate portion of the array
        switch (offSet) {
            case 0:
                recs = _.take(recs, next);
                break;
            default:
                recs = _.drop(recs, offSet * next);
                recs = _.dropRight(recs, recs.length - next);
        }

        return recs;
    }


};