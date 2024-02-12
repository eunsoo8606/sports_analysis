module.exports={
    INSERT : 'INSERT INTO BLOG (MEMBER_SEQ,MAIN_IMG,TITLE,CONTENT,REGP_IP,REGP_SEQ,CATEGORY)VALUES(?,?,?,?,?,?,?)',
    DELETE : 'DELETE FROM BLOG WHERE BLOG_SEQ = ?',
    UPDATE : 'UPDATE BLOG SET TITLE = ?, CONTENT = ?, MAIN_IMG = ?, MDFP_IP =? ,MDFP_SEQ = ?, MDF_DTTM = NOW() WHERE BLOG_SEQ = ?',
    LIST   :(title,content,memberSeq,firstIndex)=>{ 
        var list = `SELECT B.* 
                      FROM (SELECT @rownum:=@rownum+1 AS RNUM,
                                   BLOG_SEQ,
                                   MAIN_IMG,
                                   TITLE,
                                   DATE_FORMAT(REG_DTTM,"%Y-%m-%d") as REG_DTTM,
                                   CONTENT,
                                   COUNT
                              FROM BLOG, (SELECT @rownum:=0) TMP
                             WHERE 1=1
                   ${(memberSeq !== undefined && memberSeq !== '') ? 'AND MEMBER_SEQ = ?':''}
                   ${(title !== undefined && title !== '') ? 'AND TITLE LIKE CONCAT("%",?,"%")':''}
                   ${(content !== undefined && content !== '')?'AND CONTENT LIKE CONCAT("%",?,"%")':''}
                            ORDER BY REG_DTTM DESC
                    ) B
                    ${(firstIndex !== undefined && firstIndex !== '')?'WHERE RNUM > ? AND RNUM <= ?':''}`;

                   return list;
            },
    TOTAL     : (memberSeq,title,content)=>{
                              return `SELECT COUNT(*) as COUNT 
                                        FROM BLOG
                                       WHERE 1=1
                               ${(memberSeq !== "" && memberSeq !== undefined?"AND MEMBER_SEQ = ?":"")}
                               ${(title !== undefined && title !== '') ? 'AND TITLE LIKE CONCAT("%",?,"%")':''}
                               ${(content !== undefined && content !== '')?'AND CONTENT LIKE CONCAT("%",?,"%")':''}
                               `;
                             },
    SELECT_ONE : `
                  SELECT  a.BLOG_SEQ,
                          a.MAIN_IMG,
                          a.TITLE,
                          a.MEMBER_SEQ,
                          DATE_FORMAT(a.REG_DTTM,"%Y-%m-%d") as REG_DTTM,
                          a.CONTENT ,
                          b.NICK_NAME,
                          a.COUNT
                    FROM BLOG a, MEMBER b
                   WHERE BLOG_SEQ = ?
                     AND a.MEMBER_SEQ = b.MEMBER_SEQ`,
    TOP3      :(memberSeq)=>{
        return `SELECT DATE_FORMAT(REG_DTTM,'%y.%m.%d') AS REG_DTTM,
                       BLOG_SEQ,
                       MAIN_IMG,
                       TITLE,
                       CONTENT,
                       COUNT 
                  FROM BLOG
           ${(memberSeq !== "" && memberSeq !== undefined?"WHERE MEMBER_SEQ = ?":"")}
        ORDER BY REG_DTTM DESC
           LIMIT 0,3`;},
    COUNT     :`UPDATE BLOG SET COUNT = COUNT +1 WHERE BLOG_SEQ = ?`,
    COMMENTS : `SELECT DATE_FORMAT(A.REG_DTTM,'%y.%m.%d %H:%m') AS REG_DTTM,
                        B.NICK_NAME,
                        A.TEXT,
                        A.COMMENT_SEQ,
                        A.AUTHOR_SEQ,
                        A.COMMENT_LEVEL,
                        A.PARENT_COMMENT_SEQ
                  FROM COMMENT A,MEMBER B
                 WHERE BLOG_SEQ = ?
                   AND A.AUTHOR_SEQ = B.MEMBER_SEQ`
}