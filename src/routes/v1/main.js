const express    = require('express');
const router                = express.Router();
const commRouter        = require("./blog/commController");
const commonRouter      = require('./common/common.controller');


router.use('/community',commRouter);
router.use('/common',commonRouter);
module.exports = router;