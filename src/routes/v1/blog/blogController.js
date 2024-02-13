const express = require('express');
const router  = express.Router();
const common  = require('../../../utils/commonIMT');
const path    = require('path');
const util    = require('../../../utils/util');
const fs      = require('fs');
const appRoot = require('app-root-path');
const request = require('request');
const bCount  = require('../../../middlewares/blogCount');
const commService   = require('./service/blog.service');
const commVo        = require('./vo/blog.vo');
const pagination    = require('../../../utils/pagination');
const stCd          = require('../../../utils/statusCode');
const resMsg        = require('../../../utils/responseMssage');
const success       = require('../../../utils/success');

router.get('/', (req, res) => {
    var scope;
    console.log("req.query.scope : ", req.query.scope)
    if(req.query.scope !== undefined){
        scope         = req.query.scope;
        req.session.scope = scope;
    }
    var cookies       = common.util.getCookie(req);
    var value = (cookies.acToken === undefined?{login:'N'}:{login:'Y'});
    res.render("blog/blog.ejs",value);
});

router.get('/list', async (req, res) => {
    console.log("list init....",req.query);
    let community            = {cpage:req.query.cpage,selectSize:req.query.selectSize,title:req.query.title,content:req.query.content,limit:req.query.limit,memberSeq:req.query.id};
    let scope                = req.query.scope;

    if(scope !== undefined && scope.indexOf(",") > -1){
        let categoty       = scope.split(",");

        switch(categoty[0]){
            case 'list': await list(community,res); break;
            case 'paging': await pagingList(community,res); break;
        }

    }else{
        community.memberSeq = '';
        switch(scope){
            case 'list': await list(community,res); break;
            case 'paging': await pagingList(community,res); break;
        }
    }

});

router.get('/detail/:id',async (req,res)=>{
    let commSeq     = req.params.id;
    let scope       = req.session.scope;
    let value = {commSeq:commSeq,login:'N',scope:scope};

    await commService.count(commSeq,res);

    res.render("blog/detail.ejs",value);
});

router.get("/write",(req,res)=>{
    var cookies  = common.util.getCookie(req);
    if(cookies.acToken === undefined){
        res.render("common/error/error.ejs",{state:403,'description':'로그인 후 이용 가능한 서비스 입니다.'});
        return false;
    }
    var value = (cookies.acToken === undefined?{login:'N'}:{login:'Y'});
    res.render("blog/write.ejs",value);
});

router.post('/write',(req, res) => {
    var cookies         = common.util.getCookie(req);
    var title           = req.body.title;
    var content         = req.body.content;
    var mainImg         = req.body.mainImg;
    var category        = req.body.category;
    console.log("write init.....", cookies)


    request({
            url:`${process.env.apiServerUrl}/v1/blog/write`,
            method:'POST',
            headers:{
                    'Cotent-Type':'application/json; charset=UTF-8',
                    'Authorization':'Bearer ' + cookies.acToken},
            body:{
            title:title,
            content:content,
            mainImg:mainImg,
            category:category
            },json:true
        },
        function (error, response, body) {
            if(error !== undefined && error !== null){ 
                console.log("error : ", error);
                res.status(401).send(error);
                res.end();
                return false;
            }else if(body.error !== null && body.error !== undefined){
                res.status(401).send(body.error);
                res.end();
            }
            res.send("200");
        });
    });

router.post('/upload', common.multer.single('file'),(req, res) => {
    var file     = req.file;
    var filePath = file.destination;
    var u        = filePath.split(path.join('/'));
    var imgUri   = req.headers.origin + common.util.customFileUri(u) + '/' + file.filename;
    res.send(imgUri);
});

router.get("/detail/:id/selectOne", (req,res)=>{
    const commSeq = req.params.id;
    console.log("init........")
    commService.selectOne(commSeq,res).then((data)=>{
        console.log("data : ", data)
        res.status(stCd.OK).send(success.success_json(resMsg.SUCCESS_REQUEST,data))
    });

});

router.delete("/detail/:id",(req,res)=>{
    var blogSeq = req.params.id;
    var cookies = common.util.getCookie(req);
    request({
        url:`${process.env.apiServerUrl}/v1/blog/detail`,
        method:'DELETE',
        headers:{
                 'Cotent-Type':'application/json; charset=UTF-8',
                 'Authorization':'Bearer ' + cookies.acToken},
        qs:{
          'blogSeq':blogSeq
        },json:true
      },
      function (error, response, body) {
        if(error !== undefined && error !== null){ 
            res.send("401");
            return false;
        }
        if(body === undefined){ 
            res.send("401");
            return false;
        }
        res.status(201).send({data:body.data});
      });
});

router.put("/detail/:id",(req,res)=>{
    let blogSeq         = req.params.id;
    let cookies         = common.util.getCookie(req);
    let title           = req.body.title;
    let content         = req.body.content;
    let mainImg         = req.body.mainImg;
    request({
            url:`${process.env.apiServerUrl}/v1/blog/detail`,
            method:'PUT',
            headers:{
                    'Cotent-Type':'application/json; charset=UTF-8',
                    'Authorization':'Bearer ' + cookies.acToken},
            body:{
            title:title,
            content:content,
            mainImg:mainImg,
            blogSeq:blogSeq
            },json:true
        },
        function (error, response, body) {
            if(error !== undefined && error !== null){
                console.log("error : ", error);
                res.status(401).send(error);
                res.end();
                return false;
            }
            res.send("200");
        });
    res.send("200");
    });

    router.get("/top3",(req,res)=>{
    var cookies     = common.util.getCookie(req);
    
    request({
        url:`${process.env.apiServerUrl}/v1/blog/top3`,
        method:'GET',
        headers:{
                 'Cotent-Type':'application/json; charset=UTF-8',
                 'Authorization':'Bearer ' + cookies.acToken},
        qs:{'scope':'list'},
        json:true
      },
      function (error, response, body) {
        if(error !== undefined && error !== null){ 
            res.send("401");
            return false;
        }
        if(body === undefined){ 
            res.send("401");
            return false;
        }
     
        res.send({data:body.data});
      });
    });



router.delete('/upload',(req, res) => {
    var delFile = req.body.delFile;

    if(delFile == "" || delFile == undefined) {
        res.send("file is not found..");
        return false;
    }

    fs.unlink(path.join(appRoot + "/src/public",delFile),(err)=>{ 
        if (err !== undefined || err != null){
            res.send("N");
            return false;
        }
        res.send("Y");
    });
});


router.get("/detail/:id/comments",(req,res)=>{
    var blogSeq = req.params.id;
    var cookies = common.util.getCookie(req);

    request({
        url:`${process.env.apiServerUrl}/v1/blog/detail/comments`,
        method:'GET',
        headers:{
                 'Cotent-Type':'application/json; charset=UTF-8',
                 'Authorization':'Bearer ' + cookies.acToken},
        qs:{
          'blogSeq':blogSeq
        },json:true
      },
      function (error, response, body) {
        if(error !== undefined && error !== null){ 
            res.status(401);
            res.end();
            return false;
        }
        
        if(body === undefined){ 
            res.status(401);
            res.end();
            return false;
        }
        
        res.status(200).send(body.data);
      });
});
router.post("/detail/:id/comments",(req,res)=>{
    var blogSeq      = req.params.id;
    var cookies      = common.util.getCookie(req);
    var text         = req.body.text;
    var authSeq      = req.body.authSeq;
    var parentSeq    = req.body.parentSeq;
    var commentLevel = req.body.commentLevel;
    request({
        url:`${process.env.apiServerUrl}/v1/blog/detail/comments`,
        method:'POST',
        headers:{
                 'Cotent-Type':'application/json; charset=UTF-8',
                 'Authorization':'Bearer ' + cookies.acToken},
        body:{
          'blogSeq':blogSeq,
          'text':text,
          'authSeq':authSeq,
          'parentSeq':parentSeq,
          'commentLevel':commentLevel
        },
        json:true
      },
      function (error, response, body) {
        if(error !== undefined && error !== null){ 
            res.send("401");
            return false;
        }
        
        if(body === undefined){ 
            res.send("401");
            return false;
        }

        if(body.error !== undefined){
            res.send(body.error);
            return false;
        }
        res.send(body.data.toString());
      });
});


router.delete("/detail/:id/comments",(req,res)=>{
    var blogSeq     = req.params.id;
    var cookies     = common.util.getCookie(req);
    var commentSeq  = req.body.commentSeq; 
    console.log("commentSeq ::: ", commentSeq)
    request({
        url:`${process.env.apiServerUrl}/v1/blog/detail/comments`,
        method:'DELETE',
        headers:{
                 'Cotent-Type':'application/json; charset=UTF-8',
                 'Authorization':'Bearer ' + cookies.acToken},
        qs:{
          'blogSeq':blogSeq,
          'commentSeq':commentSeq
        },json:true
      },
      function (error, response, body) {
        if(error !== undefined && error !== null){ 
            res.send("401");
            return false;
        }
        if(body === undefined){ 
            res.send("401");
            return false;
        }
        res.status(201).send({data:body.data});
      });
});


router.put("/detail/:id/comments",(req,res)=>{
    let blogSeq     = req.params.id;
    let cookies  = common.util.getCookie(req);
    let commentSeq  = req.body.commentSeq;
    let text        = req.body.conts;

    request({
        url:`${process.env.apiServerUrl}/v1/blog/detail/comments`,
        method:'PUT',
        headers:{
                 'Cotent-Type':'application/json; charset=UTF-8',
                 'Authorization':'Bearer ' + cookies.acToken},
        body:{
          'blogSeq':blogSeq,
          'commentSeq':commentSeq,
          'text':text
        },json:true
      },
      function (error, response, body) {
        if(error !== undefined && error !== null){ 
            res.send("401");
            return false;
        }
        if(body === undefined){ 
            res.send("401");
            return false;
        }
        res.status(201).send({data:body.data});
      });
});



async function list(community,res){
    console.log("list inti...")
    commService.selectList(community,res).then((data)=>{
        res.status(stCd.OK).send(success.success_json(resMsg.SUCCESS_REQUEST,data,''));
        res.end();
    });
}

async function pagingList(community,res){
    let paging         = {};
    let totalCount     = 0;
    let totalPageCount = 0;
    //내 블로그 작성글 전체 카운트
    await commService.totalCount(community,res).then((data)=>{
        totalCount         = data;
        var limit          = 10;

        if(community.selectSize !== undefined)
            limit = community.selectSize

        community.lastIndex     = pagination.lastIndex(community.cpage,limit);
        totalPageCount     = pagination.getTotalPageCount(totalCount,limit);
        community.firstIndex    = pagination.firstIndex(community.cpage,limit);

         commService.selectList(community,res).then((data)=>{
            paging.totalpage    = parseInt(totalPageCount);
            paging.totalCount   = parseInt(totalCount);
            res.status(stCd.OK).send(success.success_json(resMsg.SUCCESS_REQUEST,data,'',paging));
            res.end();
        });
    });
}


module.exports = router;