const puppeteer = require('puppeteer');
// https://www.woolworths.co.nz/shop/browse?page=1&inStockProductsOnly=false&filters=All;All;All;true;
const fs = require('fs');

async function scrapeCountdownWithHead(url, startPage, endPage) {
    // Launch a headless browser
    const browser = await puppeteer.launch(
        {
            args: ['--disable-http2'],
            headless: false
            // timeout: 60000 // 60 seconds timeout
        }
    );
    const results = [];
    for (let i = startPage; i <= endPage; i++) {
        const page = await browser.newPage();
        // Go to the Countdown product page replace pageNum with startPage in url
        const queryUrl = url.replace('pageNum', i);
        await page.goto(queryUrl, { waitUntil: 'networkidle2' });

        // Wait for the product elements to load
        await page.waitForSelector('.product-entry'); // Adjust this selector as per the actual website structure
        // Scrape product details
        const products = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.product-entry')); // Adjust the selector
            return items.map(item => {
                const nameElement = item.querySelector('[id^="product-"][id$="-title"]'); // Adjust the selector
                const name = nameElement.innerText; // Adjust the selector
                const idNumber = nameElement.id.match(/product-(\d+)-title/)[1];
                const price = item.querySelector(`#product-${idNumber}-price`).getAttribute('aria-label'); // Adjust the selector
                return { name, price };
            });
        });
        results.push({ page: i, products });
    }
    // Write the data to a file
    fs.writeFileSync(`products.json`, JSON.stringify(results, null, 2));
    // Close the browser
    await browser.close();
}

async function scrapeCountdown(url, startPage, endPage) {
    console.log('Scraping Countdown...');
    const browser = await puppeteer.launch({
        args: ['--disable-http2', '--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
        protocolTimeout: 120000 // Increased timeout
    });

    const results = [];

    for (let i = startPage; i <= endPage; i++) {
        const page = await browser.newPage();
        const queryUrl = url.replace('pageNum', i);
        console.log(`Navigating to ${queryUrl}`);
        // Set a custom user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36');

        let attempts = 0;
        let success = false;

        while (attempts < 3 && !success) {
            try {
                await page.goto(queryUrl, { waitUntil: 'networkidle2', timeout: 120000 });
                success = true; // Break loop if navigation is successful
            } catch (error) {
                attempts++;
                console.error(`Attempt ${attempts} failed: ${error.message}`);
            }
        }

        if (!success) {
            console.error(`Failed to load page ${queryUrl} after 3 attempts.`);
            await page.close();
            continue; // Skip to next page
        }

        await page.waitForSelector('.product-entry', { timeout: 120000 });

        const products = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.product-entry'));
            return items.map(item => {
                const nameElement = item.querySelector('[id^="product-"][id$="-title"]');
                const name = nameElement.innerText;
                const idNumber = nameElement.id.match(/product-(\d+)-title/)[1];
                const price = item.querySelector(`#product-${idNumber}-price`).getAttribute('aria-label');
                return { name, price };
            });
        });

        results.push({ page: i, products });
        await page.close(); // Close the page after scraping
    }

    fs.writeFileSync(`products-headless.json`, JSON.stringify(results, null, 2));
    await browser.close();
}

const url = `https://www.woolworths.co.nz/shop/browse?page=pageNum&inStockProductsOnly=false&filters=All;All;All;true;`;
// scrapeCountdownWithHead(url, 1, 2);
scrapeCountdown(url, 1, 2);





