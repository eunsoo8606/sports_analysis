
module.exports={
    /** 
     * totalCount : 전체 페이지 수
     * totalRecodeCountPerPage : 한 페이지당 보여질 게시물 숫자.
    */
    getTotalPageCount:(totalCount,recodeCountPerPage)=>{
        if(recodeCountPerPage == "") recodeCountPerPage = 10;
        
        var totalPageCount = ((totalCount - 1) / recodeCountPerPage) + 1;
		return totalPageCount;
    },
    firstIndex:(cpage,recodeCountPerPage)=>{
        if(cpage == undefined) cpage = 1;
        if(recodeCountPerPage == "") recodeCountPerPage = 10;

        var firstRecordIndex = (cpage - 1) * recodeCountPerPage;
		return firstRecordIndex;
    },
    lastIndex:(cpage,recodeCountPerPage)=>{
        if(cpage == undefined) cpage = 1;
        if(recodeCountPerPage == "") recodeCountPerPage = 10;

        var lastIndex = cpage * recodeCountPerPage;
		return lastIndex;
    }
}