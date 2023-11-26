const express = require("express");
const jsdom = require("jsdom");

const app = express();
const port = process.env.PORT || 3000;
const { JSDOM } = jsdom;

const BASE_URL = "https://www.metal-archives.com";

app.get("/bands/:bandName", async (req, res) => {
  const { bandName } = req.params;
  const {
    window: { document },
  } = await JSDOM.fromURL(`${BASE_URL}/bands/${bandName}`);

  // Comment
  const commentScript = document
    .querySelector("#band_info > div.band_comment.clear > div > a")
    .getAttribute("onclick");
  const comment = await getComment(extractCommentURL(commentScript));

  // Discography
  const discographyURL = document
    .querySelector("#band_disco > ul > li:nth-child(1) > a")
    .getAttribute("href");
  const discography = await getDiscography(discographyURL);

  const band = {
    bandName: document.querySelector("#band_info > h1 > a").textContent,
    logo: document.querySelector("#logo > img").getAttribute("src"),
    bandImage: document.querySelector("#photo > img").getAttribute("src"),
    comment,
    countryOfOrigin: document.querySelector(
      "#band_stats > dl.float_left > dd:nth-child(2) > a",
    ).textContent,
    location: document.querySelector(
      "#band_stats > dl.float_left > dd:nth-child(4)",
    ).textContent,
    status: document.querySelector(
      "#band_stats > dl.float_left > dd:nth-child(6)",
    ).textContent,
    formedIn: document.querySelector(
      "#band_stats > dl.float_left > dd:nth-child(8)",
    ).textContent,
    yearsActive: document.querySelector("#band_stats > dl.clear > dd")
      .textContent,
    genre: document.querySelector(
      "#band_stats > dl.float_right > dd:nth-child(2)",
    ).textContent,
    themes: document.querySelector(
      "#band_stats > dl.float_right > dd:nth-child(4)",
    ).textContent,
    lastLabel: document.querySelector(
      "#band_stats > dl.float_right > dd:nth-child(6) > a",
    ).textContent,
    discography,
  };

  res.send(band);
});

app.listen(port, () => {
  console.log(`Metal Archives App listening on port ${port}`);
});

function extractCommentURL(text) {
  const regex = /readMore\(['"]([^'"]+)['"]\)/;
  const match = text.match(regex);

  if (match) {
    const extractedString = match[1];
    return extractedString;
  }
  return "";
}

async function getComment(path) {
  const response = await fetch(`${BASE_URL}/${path}`);
  const html = await response.text();
  return html;
}

async function getDiscography(url) {
  const response = await fetch(url);
  const html = await response.text();
  const {
    window: { document },
  } = new JSDOM(html);

  const tableRows = document.querySelectorAll("table tbody tr");
  const discography = [];
  tableRows.forEach((row) => {
    let cells = row.querySelectorAll("td");
    let album = {
      name: cells[0].textContent.trim(),
      type: cells[1].textContent.trim(),
      year: cells[2].textContent.trim(),
    };
    discography.push(album);
  });
  return discography;
}
