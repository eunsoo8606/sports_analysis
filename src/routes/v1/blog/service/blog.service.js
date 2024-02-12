const errors      = require('../../../../utils/error');
const resMsg      = require('../../../../utils/responseMssage');
const blogQs      = require('../query/blog.query');
const mysqlConObj = require('../../../../config/mysql');
const common      = require('../../common/common.vo').common;
const commonVO    = require('../../common/common.vo').commonVO;
const comQs       = require('../query/comment.query');
const stCd        = require("../../../../utils/statusCode");

module.exports = {
    insert : (data) =>{
        return new Promise((resolve, reject)=>{
                var db = mysqlConObj.init();
                db.beginTransaction();
                console.log(" query : ", blogQs.INSERT)
                console.log("Data : ",data)
                db.query(blogQs.INSERT,data,function(err,results,fields){
                    if (err !== undefined && err !== null) {
                        console.log("init...",err)
                        db.rollback();
                        db.end();
                        return false;
                    }
                    if(results.affectedRows === 0){
                        db.rollback();
                        db.end();
                        return false;
                    }
                    db.commit();
                    return resolve(results.affectedRows);
                });
        });
    },
    selectList: (blog,res)=>{
        return new Promise((resolve,reject)=>{
            var db = mysqlConObj.init();
            console.log(" query : ", blogQs.LIST(blog.title,blog.content,blog.memberSeq,blog.firstIndex));
            console.log("query value : ", common(blog))
            db.query(blogQs.LIST(blog.title,blog.content,blog.memberSeq,blog.firstIndex),common(blog), function (err, results, fields) {
                //result Check
                if (err || !results || results.length == 0) {
                    res.send(errors.error(resMsg.DB_ERROR,'DATABASE ERROR..'));
                    db.end();
                    return false;
                }
                db.end();
                return resolve(results);
            });
        });
    },
    totalCount: (blog,res)=>{
        return new Promise((resolve,reject)=>{
            var db = mysqlConObj.init();
            console.log("blod : ", blog)
            console.log("totaCount query : ", blogQs.TOTAL(blog.memberSeq,blog.title,blog.content))
            console.log("totalCount value : ",commonVO([blog.memberSeq,blog.title,blog.content]))
            db.query(blogQs.TOTAL(blog.memberSeq,blog.title,blog.content),commonVO([blog.memberSeq,blog.title,blog.content]), function (err, results, fields) {
                //result Check
                if (err || !results || results.length == 0) {
                    console.log("err : ", err);
                    res.send(errors.error(resMsg.BAD_REQUEST,err));
                    db.end();
                    return false;
                }
                var count = results[0].COUNT;
                db.end();
                return resolve(count);
            });
        });
    },
    selectOne:(blogSeq,res)=>{
        return new Promise((resolve,reject)=>{
            var db = mysqlConObj.init();
     
            db.query(blogQs.SELECT_ONE,blogSeq, function (err, results, fields) {
                //result Check
                if (err || !results || results.length == 0) {
                    res.send(errors.error(resMsg.DB_ERROR,err));
                    db.end();
                    return false;
                }
                var result = results;
                db.end();
                return resolve(result);
            });
        });
    },
    deleteBlog:(blogSeq,res)=>{
        return new Promise((resolve,reject)=>{
            var db = mysqlConObj.init();
            db.beginTransaction();
            var resultRow = 0;
            console.log(" query : ", blogQs.DELETE)
            db.query(blogQs.DELETE,blogSeq,function(err,results,fields){
                console.log("result :", results)
                if (err !== undefined && err !== null) {
                    console.log("init...",err)
                    db.rollback();
                    db.end();
                    res.send(errors.error(resMsg.BAD_REQUEST,'BLOG VALUE',data,'DELETE QUERY ERROR',err));
                    return false;
                }
                if(results.affectedRows === 0){
                    db.rollback();
                    db.end();
                    res.status(stCd.BAD_REQUEST).send(errors.error(resMsg.INSERT_FAILD,'BLOG VALUE','','DELETE Error','DELETE FAILAD..'));
                    return false;
                }
                resultRow = results.affectedRows;
                db.query(comQs.DELETE_ALL,blogSeq,function(err,results,fields){
                        console.log("result :", results)
                        if (err !== undefined && err !== null) {
                            console.log("init...",err)
                            db.rollback();
                            db.end();
                            res.send(errors.error(resMsg.BAD_REQUEST,err));
                            return false;
                        }
                        db.commit();
                        db.end();
                        return resolve(resultRow);
                });
            });
        });
    },
    update:(blog,res)=>{
        return new Promise((resolve,reject)=>{
            var db = mysqlConObj.init();
                db.beginTransaction();
                console.log("blog update query : ", blogQs.UPDATE);
                console.log("blog data : ", blog)
                db.query(blogQs.UPDATE,blog,function(err,results,fields){
                    console.log("result :", results)
                    if (err !== undefined && err !== null) {
                        console.log("init...",err)
                        db.rollback();
                        db.end();
                        res.send(errors.error(resMsg.BAD_REQUEST,'APP VALUE',data,'QUERY ERROR',err));
                        return false;
                    }
                    if(results.affectedRows === 0){
                        db.rollback();
                        db.end();
                        res.status(stCd.BAD_REQUEST).send(errors.error(resMsg.INSERT_FAILD,'APP VALUE','','INSERT Error','INSERT FAILAD..'));
                        return false;
                    }
                    db.commit();
                    db.end();
                    return resolve(results.affectedRows);
                });
        });
    },
    selectBlogTop3:(memberSeq,res)=>{
        return new Promise((resolve,reject)=>{
            var db = mysqlConObj.init();
            db.beginTransaction();
            console.log("top3 query : ", blogQs.TOP3(memberSeq))
            db.query(blogQs.TOP3(memberSeq),memberSeq, function (err, results, fields) {
                //result Check
                if (err !== undefined && err !== null) {
                    console.log("init...",err)
                    db.rollback();
                    db.end();
                    res.send(errors.error(resMsg.DB_ERROR,err));
                    return false;
                }
                if(results === null && results === undefined){
                    db.rollback();
                    db.end();
                    res.status(stCd.BAD_REQUEST).send(errors.error(resMsg.EMPTY_VALUE,'Result Null..'));
                    return false;
                }
                db.commit();
                db.end();
                return resolve(results);
            });
        });
    },
    count:(blogSeq)=>{
            var db = mysqlConObj.init();
            console.log("top3 query : ", blogQs.COUNT)
            db.query(blogQs.COUNT,blogSeq, function (err, results, fields) {
                //result Check
                if (err || !results || results.length == 0) {
                    res.send(errors.error(resMsg.BAD_REQUEST,'DB ERROR..'));
                    db.end();
                    return false;
                }
                var result = results;
                db.end();
                return result;
            });
    },
    selectComments:(blogSeq,res)=>{
        return new Promise((resolve,reject)=>{
            var db = mysqlConObj.init();
            console.log(" query : ", blogQs.COMMENTS);
            console.log("query value : ", blogSeq)
            db.query(blogQs.COMMENTS,blogSeq, function (err, results, fields) {
                console.log("comments result : ", results);
                //result Check
                if (err || !results || results.length == 0) {
                    res.send(errors.error(resMsg.DB_ERROR,'DATABASE ERROR..'));
                    db.end();
                    return false;
                }
                
                db.end();
                return resolve(results);
            });
        });
    },
    insertComment:(comment,parentSeq,res)=>{
        return new Promise((resolve,reject)=>{
            var db = mysqlConObj.init();
                db.beginTransaction();
                db.query(comQs.INSERT(parentSeq),comment,function(err,results,fields){
                    if (err !== undefined && err !== null) {
                        console.log("init...",err)
                        db.rollback();
                        db.end();
                        res.send(errors.error(resMsg.BAD_REQUEST,err));
                        return false;
                    }
                    if(results.affectedRows === 0){
                        db.rollback();
                        db.end();
                        res.status(stCd.BAD_REQUEST).send(errors.error(resMsg.INSERT_FAILD,'INSERT FAILAD..'));
                        return false;
                    }
                    db.commit();
                    db.end();
                    return resolve(results.affectedRows);
                });
        });
    },
    deleteComment:(comment,res)=>{
        return new Promise((resolve,reject)=>{
            var db = mysqlConObj.init();
                db.beginTransaction();
                console.log(" query : ", comQs.DELETE)
                console.log("delete comment data : ", comment)
                db.query(comQs.DELETE,comment,function(err,results,fields){
                    console.log("result :", results)
                    if (err !== undefined && err !== null) {
                        console.log("init...",err)
                        db.rollback();
                        db.end();
                        res.send(errors.error(resMsg.BAD_REQUEST,err));
                        return false;
                    }
                    console.log("result : ", results[0][0].RESULT);
                    if(results[0][0].RESULT === 0){
                        db.rollback();
                        db.end();
                        res.status(stCd.BAD_REQUEST).send(errors.error(resMsg.INSERT_FAILD,'DELETE FAILAD..'));
                        return false;
                    }

                    db.commit();
                    db.end();
                    return resolve(results[0][0].RESULT);
                });
        });
    },
    updateComment:(comment,res)=>{
        return new Promise((resolve,reject)=>{
            var db = mysqlConObj.init();
                db.beginTransaction();
                console.log(" query : ", comQs.UPDATE)
                console.log("update comment data : ", comment)
                db.query(comQs.UPDATE,comment,function(err,results,fields){
                    console.log("result :", results)
                    if (err !== undefined && err !== null) {
                        console.log("init...",err)
                        db.rollback();
                        db.end();
                        res.send(errors.error(resMsg.BAD_REQUEST,err));
                        return false;
                    }
                    if(results.affectedRows === 0){
                        db.rollback();
                        db.end();
                        res.status(stCd.BAD_REQUEST).send(errors.error(resMsg.INSERT_FAILD,'DELETE FAILAD..'));
                        return false;
                    }
                    db.commit();
                    db.end();
                    return resolve(results.affectedRows);
                });
        });
    }
}