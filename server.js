const express  = require('express');
const puppeteer = require('puppeteer');   // ← use plain Puppeteer
const app      = express();
const PORT     = process.env.PORT || 3000;

/**
 * GET /carrier-phone/:dot
 * Example: /carrier-phone/2785311
 */
app.get('/carrier-phone/:dot', async (req, res) => {
  const dot = req.params.dot;

  // Snapshot URL pattern (works for every USDOT)
  const url = `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${dot}`;

  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
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
    res.status(500).json({ error: 'Scraper error', details: err.message, dot });
  }
});

app.listen(PORT, () => {
  console.log(`✅  Server running on port ${PORT}`);
});
