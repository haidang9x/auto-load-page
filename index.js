
/* libs */



const puppeteer = require('puppeteer');



/* function helper common */
	function randArr(arr) {
		return arr[Math.floor(Math.random() * arr.length)];
	}
function getNow() {
	const nDate = new Date().toLocaleString('en-US', {
	  timeZone: 'Asia/Ho_Chi_Minh'
	});
	return nDate;
}
/* function helper libs*/
	//uag
	var random_useragent = require('random-useragent');
	function getUA() {
		return random_useragent.getRandom(function (ua) {
			var ualowser = ua.userAgent.toLowerCase();
			return ualowser.indexOf('Mobile')==-1 && ualowser.indexOf('opera mini')==-1?1:0;
		});
	}
	
	//using exec restart
	function execScript(scripts) {
		var exec = require('child_process').exec;
		exec(scripts, function(err, stdout, stderr) {
		  if (err) {
			  console.error(err);
			// should have err.code here?  
		  }
		  console.log(stdout);
		});
		
	}
	function restartIndex() {
		execScript("killall -9 puppeteer;killall -9 node;pm2 restart getsearch-puppeteer");
	}
	function clearRam() {
		execScript("sync; echo 3 > /proc/sys/vm/drop_caches");
	}
// write logs file
var fs = require('fs'),
	util = require('util');
function ConsoleRequest(filelog='debug.log.txt', arg=[]) {
		fs.appendFile(__dirname + '/logs/'+filelog, arg.join(' ')+'\n', function(err) {
			if(err) {
				return console.log(err);
			}
		});
		console.log.apply(null, arg); //open log
}	
	
	
	
/* setup libs */

/* variable libs */
	//puppeteer option:
	function getPpOptions() {
		var pp_options = {
			headless: false,
			defaultViewport: null,
			args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications', '--disable-popup-blocking', '--disable-prompt-on-repost','--start-maximized']
		};
		return pp_options;
	}
	function getUaPp() {
		return getUA();
	}
	
	async function pagePpSetup(page, proxy) {
		if(proxy) {
			await page.authenticate({
				username: 'lum-customer-danghai-zone-static',
				password: 'gd4c79xerdl3'
			});
		}
		await page.setCacheEnabled(false);
		await page.setUserAgent(getUaPp());
		//https://github.com/GoogleChrome/puppeteer/issues/1632
		await page._client.send('Network.clearBrowserCookies');
	}

/* function hanlder */


//testing data
async function testProxy() {
	var proxy = 1;
	let config = getPpOptions();
	//setup proxy
	if(proxy) config.args.push('--proxy-server=zproxy.lum-superproxy.io:22225');
	const browser = await puppeteer.launch(config);
	await browser.userAgent(getUaPp());
	const page = await browser.newPage();
	await pagePpSetup(page, proxy);
	var url = 'http://lumtest.com/myip.json';
	await page.goto(url);
	var data = await page.evaluate(() => {
		return document.documentElement.innerHTML;
	});
	console.log(data);
	browser.close();
	
}
//testProxy();
async function testUa() {
	let config = getPpOptions();
	//setup proxy
	console.log(config);
	const browser = await puppeteer.launch(config);
	//await browser.userAgent(getUaPp());
	const page = await browser.newPage();
	await pagePpSetup(page, 0);
	var url = 'https://www.whatsmyua.info/';
	await page.goto(url);
	var data = await page.evaluate(() => {
		return document.querySelector('#custom-ua-string').value;//documentElement.innerHTML;
	});
	console.log(data);
	var pages = await browser.pages();
		for (let i = 0, I = pages.length; i < I; ++i) {
			if(i>0) pages[i].close();
		}
	//await page.close();
	//browser.close();
	
}
//testUa()

//puppeteer:
async function closePages() {
	var pages = await browser.pages();
	var worker = [];
		for (let i = 0, I = pages.length; i < I; ++i) {
			if(i>0) worker.push(pages[i].close());
		}
	if(worker.length>0) await Promise.all(worker);
}
function handleClose(){
	closePages();
}
function evBrowser() {
	
    process.on("uncaughtException", () => {
        handleClose();
    });

    process.on("unhandledRejection", () => {
        handleClose();
    });
}
//getdata
var browser = 0;
var urls = require('./page_url.js');
var tabs = 0;
var lenUrls = urls.length;
async function openBrowser(proxy=0) {
	let config = getPpOptions();
	//setup proxy
	if(proxy) config.args.push('--proxy-server=zproxy.lum-superproxy.io:22225');
	
	browser = await puppeteer.launch(config);
	var allworker = [];
		for(i=0;i<lenUrls;i++) {
			if(tabs>=lenUrls) tabs = 0;
			let url = urls[tabs];
			tabs++;
			allworker.push(openPage(url));
		}
	var data = await Promise.all(allworker);
	//closePages();
		var pages = await browser.pages();
	var worker = [];
		for (let i = 0, I = pages.length; i < I; ++i) {
			if(i>0) worker.push(pages[i].close());
		}
	if(worker.length>0) await Promise.all(worker);
	await browser.close();
	//process.exit(0);
	
}
const autoScroll = async (page) => {
	await page.evaluate( () => {
		window.scroll({ 
		  top: document.body.scrollHeight, // could be negative value
		  left: 0, 
		  behavior: 'smooth' 
		});
	});
}
async function openLinks(page) {
	let links = await page.evaluate( () => {
		function randArr(arr) {
			return arr[Math.floor(Math.random() * arr.length)];
		}
		let link = document.querySelectorAll('a');
		randArr(link).click();
		window.location.href = link.href;
	});
	await page.waitForNavigation();
	await autoScroll(page);
		
}
async function openPage(url) {
	const page = await browser.newPage();
	await page.on('dialog', async dialog => {
		console.log(dialog.message());
		await dialog.dismiss();
	});
	await pagePpSetup(page, 0);
	await page.goto(url);    
	//await page.waitForNavigation();
	//await page.waitFor('body');
	await autoScroll(page);
	await openLinks(page);
	await page.close();
	
}

// handler request:
async function run(){
	await openBrowser(0);
	await run();
}
run();

