const express = require('express');
const chromium = require('chrome-aws-lambda');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/carrier-phone/:dot', async (req, res) => {
  const dot = req.params.dot;
  const url = `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&original_query_param=NAME&query_string=${dot}&original_query_string=Carrier`;

  let browser;

  try {
    const executablePath = await chromium.executablePath;

    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const phone = await page.evaluate(() => {
      const td = Array.from(document.querySelectorAll('td')).find(el =>
        el.textContent.includes('Phone:')
      );
      return td ? td.textContent.replace('Phone:', '').trim() : null;
    });

    await browser.close();

    if (phone) {
      res.json({ dot, phone });
    } else {
      res.status(404).json({ error: 'Phone number not found', dot });
    }
  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: 'Scraper error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
