const express = require('express');
const puppeteer = require('puppeteer');       // ← regular Puppeteer
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * GET /carrier-phone/:dot
 * Returns { dot, phone }  —or—  an error JSON
 */
app.get('/carrier-phone/:dot', async (req, res) => {
  const dot = req.params.dot;
  const url = `https://safer.fmcsa.dot.gov/query.asp?query_type=DOT&query_param=${dot}`;
  let browser;

  try {
    // Launch headless Chromium shipped by Puppeteer.
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Grab the <td> that contains "Phone:"
    const phone = await page.evaluate(() => {
      const cell = [...document.querySelectorAll('td')].find(td =>
        td.textContent.includes('Phone:')
      );
      return cell ? cell.textContent.replace('Phone:', '').trim() : null;
    });

    await browser.close();

    if (phone) {
      res.json({ dot, phone });
    } else {
      res.status(404).json({ error: 'Phone number not found', dot });
    }
  } catch (err) {
    if (browser) await browser.close();
    res
      .status(500)
      .json({ error: 'Scraper error', details: err.message, dot });
  }
});

app.listen(PORT, () => {
  console.log(`✅  Server running on port ${PORT}`);
});
