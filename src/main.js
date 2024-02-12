const express            = require('express');
const app                = express();
const session            = require('express-session');
const compression        = require('compression');
const flash              = require("connect-flash");
const routes             = require('./routes/index');
const path = require('path');

require('dotenv').config();
/** SSL 적용을 위해 greenlock-express module 사용 */

// require('greenlock-express').init({
//   packageRoot: __dirname,
//   configDir: './greenlock.d',
//   maintainerEmail: 'eunsoo8606@naver.com',
// }).serve(app);

/** Session 생성 */
app.use(session({
    resave:false,
    saveUninitialized:false,
    secret:'secret code.',
    cookie:{
        secure:false,
        maxAge:null,
        httpOnly:true
    }
}));


app.use(express.static("public"));
app.use(express.json());
app.use(compression());
app.use(express.urlencoded({ extended: true }));// for parsing application/x-www-form-urlencoded
app.use(flash());

app.set("views",__dirname + '/views');
app.set('view engine', 'ejs');
app.engine('ejs', require('ejs').renderFile);


app.use('/',routes);

const moment    = require("moment-timezone");
const puppeteer = require('puppeteer');
const ip        = require('./lib/getIp');
const cron = require('node-cron');
const targetUrl    = 'https://damdaworld.com/humor';
const axios = require('axios');
const common         = require("./utils/commonIMT");
const appRoot           = require("app-root-path");
const util     = require("./utils/util");
const year       = moment().format("YYYY");
const month      = moment().format("MM");
const fs             = require('fs');
const blogService   = require('./routes/v1/blog/service/blog.service');
const blogVo        = require('./routes/v1/blog/vo/blog.vo');
/**
 * 스케줄러 영역
 *
 *
 * */

const getCurrentTime = async() => {
    let m = moment().tz("Asia/Seoul"); // ← 이곳이 포인트
    return m.format("YYYY-MM-DD HH:mm:ss");
};


cron.schedule('* * * * *',()=>{
    console.log("scheduler1 init........",getCurrentTime());
    scrapingHumor(targetUrl);
});


async function scrapingHumor(url){
    let width  = 1920;
    let height = 1080;
    let browserOption = {
        headless : false, // 헤드리스모드의 사용여부를 묻는다.
        devtools : false,   // 개발자 모드의 사용여부를 묻는다.
        args: [
            `--window-size=${width},${height}`,
            '--no-sandbox',
            '--disable-setuid-sandbox', // 실험적 [알려진 몇 가지 문제를 해결하는 것으로 보이므로 2001년 25일 추가]
            '--disable-dev-shm-usage',
            '--enable-features=NetworkService',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--shm-size=3gb' // this solves the issue
        ],
        ignoreHTTPSErrors: true,
    }

    const browser = await puppeteer.launch(browserOption);
    console.log("MainContent 시작....");
    const page    = await browser.newPage();
    let pages = '';

    await page.setViewport({
        width : 1920               // 페이지 너비
        , height : 1080                // 페이지 높이
        , deviceScaleFactor : 1     // 기기 배율 요소를 지정 DPR( Device Pixel Resolution )
        , isMobile : false            // 모바일
        , hasTouch : false           // 터치 이벤트 발생여부
        , isLandscape : false        //
    });


    try{

        await page.goto(url,{ waitUntil : "networkidle2" ,timeout:0});


        pages = await browser.pages();

        //레거시 tab 삭제
        const tab1 = await pages[0];
        await tab1.close();

        await page.bringToFront();


        await page.waitForTimeout(3000);
        await page.click("#board-list > div:nth-child(2) > div > ul > li:nth-child(2) > a");

        await page.waitForTimeout(3000);
        const imgUrlList = [];
        const selector = '#app-board > div.app-article-wrap > div:nth-child(3) > div.app-board-container.app-article-container > div.app-article-content.app-clearfix img';

        try{

           const images = await page.$$(selector);

            if (images.length > 0) {
                for(let i = 0; i < images.length; i++){
                    const src = await page.evaluate(img => img.src, images[i]);// 첫 번째 이미지의 URL 출력
                    const fileName = src.substr(src.lastIndexOf('/')+1,src.lastIndexOf('.'));
                    // 이미지 다운로드
                    const response = await axios({
                        method: 'GET',
                        url: src,
                        responseType: 'stream'
                    });

                    await fileUpload(response,fileName);
                    const title = await page.$eval('#app-board > div.app-article-wrap > div:nth-child(3) > div.app-board-article-head > div > h1', element => element.textContent);
                    const content = await page.$eval('#app-board > div.app-article-wrap > div:nth-child(3) > div.app-board-container.app-article-container', element => element.textContent);


                    blogService.insert(blogVo.blog('0',resource+fileName,title,content,'127.0.0.1','0','HUM','')).then((data)=>{
                        console.log("Data : ", data);
                        if(data > 0){
                            res.status(stCd.CREATED).send(success.success_json(resMsg.CREATED,data,true));
                            res.end();
                        }
                    });
                }

            } else {
                console.log('이미지가 없습니다.');
            }



        }catch(e){
            console.log("======================== None Page Content =============================");
            console.log("e ::::", e)
        }

        await browser.close();

    }catch(e){
        console.log("e : ", e);
        pages = await browser.pages();
        await browser.close();
    }
}




async function fileUpload(response,fileName){
    console.log("fileName : ", fileName);
    const resource = '/public/uploads/img/'+year.toString()+'/'+month.toString();
    let root = appRoot+resource;
    util.makeFolder(path.join(root));

    const imgUri   = root + '/' + fileName;
    if(!fileName.includes("c2dd6ad490c487293be39a6e4902ede8"))
        response.data.pipe(fs.createWriteStream(imgUri));
}









require('./www/server')(app);