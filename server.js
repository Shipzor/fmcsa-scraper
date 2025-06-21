const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/carrier-phone/:dot', async (req, res) => {
  const dot = req.params.dot;
  const url = `https://safer.fmcsa.dot.gov/query.asp?query_type=DOT&query_param=${dot}`;

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const phone = await page.evaluate(() => {
      const td = Array.from(document.querySelectorAll('td')).find(
        (el) => el.textContent.includes('Phone:')
      );
      return td ? td.textContent.replace('Phone:', '').trim() : null;
    });

    await browser.close();

    if (phone) {
      res.json({ dot, phone });
    } else {
      res.status(404).json({ error: 'Phone number not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Scraper error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
