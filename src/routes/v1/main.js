const express    = require('express');
const router                = express.Router();
const blogRouter        = require("./blog/blogController");
const commonRouter      = require('./common/common.controller');


router.use('/blog',blogRouter);
router.use('/common',commonRouter);
module.exports = router;