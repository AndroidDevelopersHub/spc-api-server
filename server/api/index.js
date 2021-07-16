var router = require('express').Router();
const today = new Date().toISOString();


router.get('/', (req,res)=>{
    res.send(' '+ today);
})

require('./users')(router)
require('./slider')(router)
require('./withdraw')(router)
require('./helpline')(router)
require('./support')(router)
require('./registration-package')(router)
require('./notification')(router)
require('./payment-settings')(router)
require('./product-category')(router)
require('./product')(router)
require('./gallery')(router)
require('./task')(router)
require('./cart')(router)
require('./order')(router)



module.exports = router;


