const express            = require('express');
const app                = express();
const session            = require('express-session');
const compression        = require('compression');
const flash              = require("connect-flash");
const routes             = require('./routes/index');
const path = require('path');

require('dotenv').config();
/** SSL 적용을 위해 greenlock-express module 사용 */

require('greenlock-express').init({
   packageRoot: __dirname,
   configDir: './greenlock.d',
   maintainerEmail: 'eunsoo8606@naver.com',
 }).serve(app);

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
const axios = require('axios');
const common         = require("./utils/commonIMT");
const appRoot           = require("app-root-path");
const util     = require("./utils/util");
const year       = moment().format("YYYY");
const month      = moment().format("MM");
const fs             = require('fs');
const commService   = require('./routes/v1/blog/service/blog.service');
const commVo        = require('./routes/v1/blog/vo/blog.vo');
/**
 * 스케줄러 영역
 *
 *
 * */

const getCurrentTime = async() => {
    let m = moment().tz("Asia/Seoul"); // ← 이곳이 포인트
    return m.format("YYYY-MM-DD HH:mm:ss");
};


cron.schedule('0,30 * * * *',()=>{
    const targetUrl    = 'https://damdaworld.com/humor';
    console.log("humor scheduler1 init........",getCurrentTime());
    scrapingHumor(targetUrl);
});

cron.schedule('0,25 * * * *',()=>{
    const targetUrl    = 'https://damdaworld.com/enter';
    console.log("enter scheduler2 init........",getCurrentTime());
    scrapingIDOL(targetUrl);
});


cron.schedule('0,50 * * * *',()=>{
    const targetUrl    = 'https://damdaworld.com/warning';
    console.log("warning scheduler3 init........",getCurrentTime());
    scrapingWarning(targetUrl);
});

cron.schedule('0,40 * * * *',()=>{
    const targetUrl    = 'https://damdaworld.com/sport';
    console.log("warning scheduler3 init........",getCurrentTime());
    scrapingSport(targetUrl);
});

//유머자료 스크랩핑
async function scrapingHumor(url){
    let width  = 1920;
    let height = 1080;
    let browserOption = {
        headless : 'new', // 헤드리스모드의 사용여부를 묻는다.
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

        await page.reload();

        await page.waitForTimeout(2000);

        const selector  = '#article_1 img';
        const site       = await page.url();

        const pageNum   = site.substr(site.lastIndexOf('/')+1);
        let   pageCnt = 0;
        try{
            console.log("pageNum : ", pageNum)
            await commService.pageCount(pageNum).then((data)=>{
                console.log("data : ", data)
                if(data > 0){
                    pageCnt = data;
                }
            });

            if(pageCnt > 0){
               await browser.close();
               return false;
            }

            const images = await page.$$(selector);
            const resource = '/uploads/img/'+year.toString()+'/'+month.toString()+"/";
            let mainImg = ``;
            let content  = `<p>`;
            if (images.length > 0) {
                for(let i = 0; i < images.length; i++){
                    const src = await page.evaluate(img => img.src, images[i]);// 첫 번째 이미지의 URL 출력
                    const fileName = src.substr(src.lastIndexOf('/')+1,src.lastIndexOf('.'));

                    if(fileName.includes("c2dd6ad490c487293be39a6e4902ede8")) continue;

                    mainImg = fileName;
                    // 이미지 다운로드
                    const response = await axios({
                        method: 'GET',
                        url: src,
                        responseType: 'stream'
                    });

                    await fileUpload(response,fileName);
                    content  += `<img src="${resource+fileName}" alt="" data-pswp-pid="1" />`;

                }
                content += `</p>`;

                let title    = await page.$eval('#app-board > div.app-article-wrap > div:nth-child(3) > div.app-board-article-head > div > h1', element => element.textContent);
                await commService.insert(commVo.community('0',pageNum,site,resource+mainImg, title, content,'127.0.0.1','0','HUM','')).then((data)=>{
                    console.log("Data : ", data);
                    if(data > 0){
                        console.log("data insert success!");
                    }
                });

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
        await browser.close();
    }
}

async function scrapingIDOL(url){
    let width  = 1920;
    let height = 1080;
    let browserOption = {
        headless : 'new', // 헤드리스모드의 사용여부를 묻는다.
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

        await page.reload();

        await page.waitForTimeout(2000);

        const selector  = '#article_1 img';
        const site       = await page.url();

        const pageNum   = site.substr(site.lastIndexOf('/')+1);
        let   pageCnt = 0;
        try{

            await commService.pageCount(pageNum).then((data)=>{
                console.log("data : ", data)
                if(data > 0){
                    pageCnt = data;
                }
            });

            if(pageCnt > 0){
                await browser.close();
                return false;
            }

            const images = await page.$$(selector);
            const resource = '/uploads/img/'+year.toString()+'/'+month.toString()+"/";
            let mainImg = ``;
            let content  = `<p>`;
            if (images.length > 0) {
                for(let i = 0; i < images.length; i++){
                    const src = await page.evaluate(img => img.src, images[i]);// 첫 번째 이미지의 URL 출력
                    const fileName = src.substr(src.lastIndexOf('/')+1,src.lastIndexOf('.'));

                    if(fileName.includes("c2dd6ad490c487293be39a6e4902ede8")) continue;

                    mainImg = fileName;
                    // 이미지 다운로드
                    const response = await axios({
                        method: 'GET',
                        url: src,
                        responseType: 'stream'
                    });

                    await fileUpload(response,fileName);
                    content  += `<img src="${resource+fileName}" alt="" data-pswp-pid="1" />`;

                }
                content += `</p>`;

                let title    = await page.$eval('#app-board > div.app-article-wrap > div:nth-child(3) > div.app-board-article-head > div > h1', element => element.textContent);
                await commService.insert(commVo.community('0',pageNum,site,resource+mainImg, title, content,'127.0.0.1','0','IDL','')).then((data)=>{
                    console.log("Data : ", data);
                    if(data > 0){
                        console.log("data insert success!");
                    }
                });

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
        await browser.close();
    }
}

async function scrapingWarning(url){
    let width  = 1920;
    let height = 1080;
    let browserOption = {
        headless : 'new', // 헤드리스모드의 사용여부를 묻는다.
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

        await page.reload();

        await page.waitForTimeout(2000);

        const selector  = '#article_1 img';
        const site       = await page.url();

        const pageNum   = site.substr(site.lastIndexOf('/')+1);
        let   pageCnt = 0;
        try{

            await commService.pageCount(pageNum).then((data)=>{
                console.log("data : ", data)
                if(data > 0){
                    pageCnt = data;
                }
            });

            if(pageCnt > 0){
                await browser.close();
                return false;
            }

            const images = await page.$$(selector);
            const resource = '/uploads/img/'+year.toString()+'/'+month.toString()+"/";
            let mainImg = ``;
            let content  = `<p>`;
            if (images.length > 0) {
                for(let i = 0; i < images.length; i++){
                    const src = await page.evaluate(img => img.src, images[i]);// 첫 번째 이미지의 URL 출력
                    const fileName = src.substr(src.lastIndexOf('/')+1,src.lastIndexOf('.'));

                    if(fileName.includes("c2dd6ad490c487293be39a6e4902ede8")) continue;

                    mainImg = fileName;
                    // 이미지 다운로드
                    const response = await axios({
                        method: 'GET',
                        url: src,
                        responseType: 'stream'
                    });

                    await fileUpload(response,fileName);
                    content  += `<img src="${resource+fileName}" alt="" data-pswp-pid="1" />`;

                }
                content += `</p>`;

                let title    = await page.$eval('#app-board > div.app-article-wrap > div:nth-child(3) > div.app-board-article-head > div > h1', element => element.textContent);
                await commService.insert(commVo.community('0',pageNum,site,resource+mainImg, title, content,'127.0.0.1','0','WRN','')).then((data)=>{
                    console.log("Data : ", data);
                    if(data > 0){
                        console.log("data insert success!");
                    }
                });

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
        await browser.close();
    }
}

async function scrapingSport(url){
    let width  = 1920;
    let height = 1080;
    let browserOption = {
        headless : 'new', // 헤드리스모드의 사용여부를 묻는다.
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

    const page    = await browser.newPage();
    let pages    = '';

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

        await page.reload();

        await page.waitForTimeout(2000);

        const selector    = '#article_1 img';
        const txtSelector = '#article_1 > div p';
        const site        = await page.url();

        const pageNum   = site.substr(site.lastIndexOf('/')+1);
        let   pageCnt = 0;
        let   pTagList = [];
        try{

            await commService.pageCount(pageNum).then((data)=>{
                console.log("data : ", data)
                if(data > 0){
                    pageCnt = data;
                }
            });

            if(pageCnt > 0){
                await browser.close();
                return false;
            }

            const images = await page.$$(selector);
            const pElements   = await page.$$(txtSelector);

            // 첫 번째 요소를 제외합니다.
            const pElementsExceptFirst = pElements.slice(1);


            const resource = '/uploads/img/'+year.toString()+'/'+month.toString()+"/";

            let mainImg = ``;
            let content  = `<p align="center">`;
            if (images.length > 0) {
                for(let i = 0; i < images.length; i++){
                    const src = await page.evaluate(img => img.src, images[i]);// 첫 번째 이미지의 URL 출력
                    const fileName = src.substr(src.lastIndexOf('/')+1,src.lastIndexOf('.'));

                    if(fileName.includes("c2dd6ad490c487293be39a6e4902ede8")) continue;

                    mainImg = fileName;
                    // 이미지 다운로드
                    const response = await axios({
                        method: 'GET',
                        url: src,
                        responseType: 'stream'
                    });

                    await fileUpload(response,fileName);
                    content  += `<img src="${resource+fileName}" alt="" data-pswp-pid="1" />`;

                }
                content += `</p><br/>`;

                // 각 요소의 텍스트 콘텐츠를 출력합니다.
                for (const element of pElementsExceptFirst) {
                    const text = await page.evaluate(el => el.textContent, element);
                    if("◈".includes(text)){
                        content += '<p align="center" style="font-weight:bold;">';
                    }else if("◈추천 배팅".includes(text)){
                        content += '<p align="center" style="font-weight:bold; color:red;">';
                    }else{
                        content += '<p align="center">';
                    }
                    content += text + '</p>';

                }

                let title    = await page.$eval('#app-board > div.app-article-wrap > div:nth-child(3) > div.app-board-article-head > div > h1', element => element.textContent);
                await commService.insert(commVo.community('0',pageNum,site,resource+mainImg, title, content,'127.0.0.1','0','SPT','')).then((data)=>{
                    console.log("Data : ", data);
                    if(data > 0){
                        console.log("data insert success!");
                    }
                });

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
        await browser.close();
    }
}

async function fileUpload(response,fileName){
    console.log("fileName : ", fileName);
    const resource = '/public/uploads/img/'+year.toString()+'/'+month.toString();
    let root = appRoot+resource;
    util.makeFolder(path.join(root));

    const imgUri   = root + '/' + fileName;

    response.data.pipe(fs.createWriteStream(imgUri));
}









require('./www/server')(app);