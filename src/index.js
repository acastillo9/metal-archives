const express = require("express");
const jsdom = require("jsdom");

const app = express();
const port = process.env.PORT || 3000;
const { JSDOM } = jsdom;

app.get("/band/:bandName", async (req, res) => {
  const { bandName } = req.params;
  const {
    window: { document },
  } = await JSDOM.fromURL(`https://www.metal-archives.com/bands/${bandName}`);
  const band = {
    bandName: document.querySelector("#band_info > h1 > a").textContent,
    logo: document.querySelector("#logo > img").getAttribute("src"),
    bandImage: document.querySelector("#photo > img").getAttribute("src"),
  };

  res.send(band);
});

app.listen(port, () => {
  console.log(`Metal Archives App listening on port ${port}`);
});
