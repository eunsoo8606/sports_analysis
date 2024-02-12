const stCd      = require('./statusCode');
const resMsg    = require('./responseMssage');
var errors       = {};
module.exports ={
    ERROR:{
        login_required:'user authentication required.',
        access_denied:'User denied access',
        consent_required:'user authentication required.',
        interaction_required:'need to collect additional personal information.'
    },
    error:(error,error_description)=>{
        errors.error = error;
        errors.error_description = error_description;
        errors.result = false;
        return errors;
    }
}