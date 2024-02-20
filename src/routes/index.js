const express           = require('express');
const router            = express.Router();
const cookie            = require('cookie');
const mainRouter        = require('./v1/main');
const commService = require("./v1/blog/service/blog.service");

router.get('/', (request, response) => {
    let category          = 'ALL';
    commService.selectMetaDataList(category,response).then((data)=>{
        console.log("data: ", data)
        response.render("index.ejs",{category:category,description:data[0].DESCRIPTION,keyword:data[0].KEYWORD,content:data[0].CONTENT});
    });
  });

  router.use('/v1',mainRouter);


  module.exports = router;