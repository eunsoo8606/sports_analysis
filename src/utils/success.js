const success = {};
require('dotenv').config();
module.exports = {
    successAuth:(authorizationCode,redirect_uri) =>{   
            success.authorizationCode = authorizationCode;
            success.redirect_uri = redirect_uri;
            
        return success;
    },
    success_json:(msg,data,result,etc)=>{
        success.success = result;
        success.providor = process.env.providor;
        success.message = msg;
        success.data = data;
        success.etc  = etc;

        return success;
    },
    success_status:(state)=>{
        success.state = state;
        success.providor = process.env.providor;
        return success;
    }
}