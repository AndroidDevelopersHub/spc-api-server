var responsecode = require('../middleware/response-code')
var responsemsg = require('../middleware/response-msg')

module.exports = {
   apiSuccess: function apiSuccess(res, msg, data, pagination){
       return res.status(200).json({
           status: responsecode.statusOk,
           message: msg,
           items: data,
           pagination: pagination
       });
   },

    apiFailed: function apiFailed(res, msg, data){
        return res.status(200).json({
            status: responsecode.statusNo,
            message: msg,
            items: data
        });
    },


    apiWarning: function apiWarning(res, msg){
        return res.status(200).json({
            status: responsecode.statusNo,
            message: msg
        });
    }

}