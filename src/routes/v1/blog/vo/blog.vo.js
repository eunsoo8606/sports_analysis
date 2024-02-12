module.exports={
    blog:(memberSeq,mainImg,title,content,regpIp,regpSeq,mainCategory) =>{
        return [memberSeq,mainImg,title,content,regpIp,regpSeq,mainCategory];
    },
    updateBlog:(title,content,mainImg,mdfpIp,mdfpSeq,blogSeq)=>{
        return [title,content,mainImg,mdfpIp,mdfpSeq,blogSeq];
    }
}