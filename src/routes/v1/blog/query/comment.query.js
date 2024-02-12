module.exports={
    INSERT:(parentSeq)=>{
        return `
                INSERT INTO 
                       COMMENT(
                                BLOG_SEQ, 
                                COMMENT_SEQ, 
                                AUTHOR_SEQ,
                                ${(parentSeq !== undefined)?'PARENT_COMMENT_SEQ,':''}
                                TEXT,
                                COMMENT_LEVEL
                                )
                        VALUES(
                                ?,
                                (SELECT IFNULL((MAX(COMMENT_SEQ)),0)+1 FROM COMMENT a),
                                ?,
                                ${(parentSeq !== undefined)?'?,':''}
                                ?,
                                ?
                               )`;
                        },
        DELETE:`CALL COMMENT_DELETE(?)`,
        DELETE_ALL:`DELETE FROM COMMENT WHERE BLOG_SEQ = ?`,
        UPDATE:`UPDATE COMMENT SET TEXT = ? WHERE BLOG_SEQ = ? AND COMMENT_SEQ = ?`
}