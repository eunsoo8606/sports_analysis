const mysql = require('mysql2');  // mysql 모듈 로드
const dotenv = require('dotenv').config();
const conn = { 
        host:     process.env.MYSQL_HOST,
        port:     process.env.MYSQL_PORT,
        user:     process.env.MYSQL_USER,
        password: process.env.MYSQL_PWD,
        database: process.env.MYSQL_DB
        };

const mysqlConnection = {
        init :  function(){
            return mysql.createConnection(conn);
        },
        open :  function(con){
                con.connect(err => { 
                    if(err) console.log("MySQL 연결 실패 : ", err); 
                    else    console.log("MySQL Connected!!!"); 
                });
        },
        close:  async (con)=>{ // #4 
                    con.end(err => { 
                        if(err) console.log("MySQL 종료 실패 : ", err); 
                        else    console.log("MySQL Terminated..."); 
                    }); 
                }
}



module.exports = mysqlConnection;
