module.exports={
    community:(memberSeq,pageNum,site,mainImg,title,content,regpIp,regpSeq,mainCategory,subCategory) =>{
        return [memberSeq,pageNum,site,mainImg,title,content,regpIp,regpSeq,mainCategory,subCategory];
    },
    updateBlog:(title,content,mainImg,mdfpIp,mdfpSeq,blogSeq)=>{
        return [title,content,mainImg,mdfpIp,mdfpSeq,blogSeq];
    }
}