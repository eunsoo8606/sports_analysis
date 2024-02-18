

module.exports={
    common:(community)=>{
        var result = [community.category,community.content,community.title,community.firstIndex,community.lastIndex];
        var origin = [];
        var j = 0;
        for(var i =0; i < result.length; i++){
            if(result[i] !== undefined && result[i] !== "") {
                origin[j] = result[i];
                j++;
            }
        }
        return origin;
    },
    /**
     * ========= 공통분리 모듈 =============
     * object 배열 넘기면 있는값만 할당해서 return 함.
     */
    commonVO:(obj)=>{
        var origin = [];
        var j = 0;
        for(var i =0; i < obj.length; i++){
            if(obj[i] !== undefined && obj[i] !== "") {
                origin[j] = obj[i];
                j++;
            }
        }
        return origin;
    }
}