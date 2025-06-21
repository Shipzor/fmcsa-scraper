const express = require('express');
const chromium = require('chrome-aws-lambda');   // ✅ Render-friendly
const app = express();
const PORT = process.env.PORT || 3000;

// --- GET /carrier-phone/:dot ----------------------------------------------
app.get('/carrier-phone/:dot', async (req, res) => {
  const dot = req.params.dot;
  const url = `https://safer.fmcsa.dot.gov/query.asp?query_type=DOT&query_param=${dot}`;
  let browser;

  try {
    // 🚀 Launch headless Chrome that actually exists on Render
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Scrape the “Phone:” <td>
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

// --------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
