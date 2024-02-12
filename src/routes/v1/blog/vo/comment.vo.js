const { blog } = require("./blog.vo");

module.exports = {
    comment:(blogSeq,authSeq,parentSeq,text)=>{
        return [blogSeq,authSeq,text];
    },
    delete:(blogSeq,commentSeq)=>{
        return [blogSeq,commentSeq];
    },
    update:(blogSeq,commentSeq,text)=>{
        return [text,blogSeq,commentSeq];
    }
}