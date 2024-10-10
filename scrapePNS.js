const puppeteer = require('puppeteer');
// https://www.woolworths.co.nz/shop/browse?page=1&inStockProductsOnly=false&filters=All;All;All;true;
const fs = require('fs');

async function scrapeCountdownWithHead(url, startPage, endPage) {
    
    const results = [];
    for (let i = startPage; i <= endPage; i++) {

        const browser = await puppeteer.launch(
            {
                args: ['--disable-http2'],
                headless: false
            }
        );
        const page = await browser.newPage();
        const queryUrl = url.replace('pageNum', i);
        await page.goto(queryUrl, { waitUntil: 'networkidle2' });
        await page.waitForSelector('[data-testid="product-title"]')
        const products = await page.$$eval('[data-testid^="product-"][data-testid$="EA-000"]', items => {
            console.log('items',items);
            return items.map(item => {
                const name = item.querySelector('[data-testid="product-title"]').innerText;
                const price = item.querySelector('[data-testid="price"]').innerText.replace(/\n\n/, '.') 
                .replace(/\n\n/g, ' ');
                return { name, price };
            });
        });
    
        results.push({ page: i, products });   
         await browser.close();

    }
    fs.writeFileSync(`productsPNS.json`, JSON.stringify(results, null, 2));
}

async function scrapeCountdown(url, startPage, endPage) {
    console.log('Scraping Countdown...');
    

    const results = [];

    for (let i = startPage; i <= endPage; i++) {
        const browser = await puppeteer.launch({
            args: ['--disable-http2', '--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
            protocolTimeout: 120000 
        });
        const page = await browser.newPage();
        const queryUrl = url.replace('pageNum', i);
        console.log(`Navigating to ${queryUrl}`);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36');

        let attempts = 0;
        let success = false;

        while (attempts < 3 && !success) {
            try {
                await page.goto(queryUrl, { waitUntil: 'networkidle2', timeout: 120000 });
                success = true; 
            } catch (error) {
                attempts++;
                console.error(`Attempt ${attempts} failed: ${error.message}`);
            }
        }

        if (!success) {
            console.error(`Failed to load page ${queryUrl} after 3 attempts.`);
            await page.close();
            continue;
        }

        // await page.waitForSelector('.product-entry', { timeout: 120000 });

        // const products = await page.evaluate(() => {
        //     const items = Array.from(document.querySelectorAll('.product-entry'));
        //     return items.map(item => {
        //         const nameElement = item.querySelector('[id^="product-"][id$="-title"]');
        //         const name = nameElement.innerText;
        //         const idNumber = nameElement.id.match(/product-(\d+)-title/)[1];
        //         const price = item.querySelector(`#product-${idNumber}-price`).getAttribute('aria-label');
        //         return { name, price };
        //     });
        // });

        await page.waitForSelector('[data-testid="product-title"]')
        const products = await page.$$eval('[data-testid^="product-"][data-testid$="EA-000"]', items => {
            console.log('items',items);
            return items.map(item => {
                const name = item.querySelector('[data-testid="product-title"]').innerText;
                const price = item.querySelector('[data-testid="price"]').innerText.replace(/\n\n/, '.') 
                .replace(/\n\n/g, ' ');
                return { name, price };
            });
        });

        results.push({ page: i, products });
        await page.close();
    }

    fs.writeFileSync(`productsPNS-headless.json`, JSON.stringify(results, null, 2));
}

const url = `https://www.paknsave.co.nz/shop/deals?pg=pageNum`;
// scrapeCountdownWithHead(url, 1, 2);
scrapeCountdown(url, 1, 2);





