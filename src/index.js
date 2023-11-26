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

  const bands = [];
  const bandList = document.querySelectorAll("#content_wrapper > ul > li > a");
  if (bandList) {
    for (const bandItem of bandList) {
      const url = bandItem.getAttribute("href");
      const band = await getBandFromURL(url);
      bands.push(band);
    }
  } else {
    const band = await getBand(document);
    bands.push(band);
  }

  res.send(bands);
});

app.listen(port, () => {
  console.log(`Metal Archives App listening on port ${port}`);
});

async function getBandFromURL(url) {
  const {
    window: { document },
  } = await JSDOM.fromURL(url);

  return getBand(document);
}

async function getBand(document) {
  // Comment
  const comment = await getComment(document);

  // Discography
  const discography = await getDiscography(document);

  // label
  let labelElement = document.querySelector(
    "#band_stats > dl.float_right > dd:nth-child(6) > a",
  );
  if (!labelElement) {
    labelElement = document.querySelector(
      "#band_stats > dl.float_right > dd:nth-child(6)",
    );
  }
  const label = labelElement.textContent;

  const band = {
    bandName: document.querySelector("#band_info > h1 > a").textContent,
    logo: document.querySelector("#logo > img")?.getAttribute("src"),
    bandImage: document.querySelector("#photo > img")?.getAttribute("src"),
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
    label,
    discography,
  };
  return band;
}

async function getComment(document) {
  let comment;
  const commentSeeMore = document.querySelector(
    "#band_info > div.band_comment .btn_read_more",
  );
  if (commentSeeMore) {
    const path = extractCommentURL(commentSeeMore.getAttribute("onclick"));
    const response = await fetch(`${BASE_URL}/${path}`);
    comment = await response.text();
  } else {
    comment = document.querySelector("#band_info > div.band_comment").innerHTML;
  }
  return comment;
}

function extractCommentURL(text) {
  const regex = /readMore\(['"]([^'"]+)['"]\)/;
  const match = text.match(regex);

  if (match) {
    const extractedString = match[1];
    return extractedString;
  }
  return "";
}

async function getDiscography(document) {
  const url = document
    .querySelector("#band_disco > ul > li:nth-child(1) > a")
    .getAttribute("href");
  const response = await fetch(url);
  const html = await response.text();
  const {
    window: { document: tableDocument },
  } = new JSDOM(html);

  const tableRows = tableDocument.querySelectorAll("table tbody tr");
  const discography = [];
  tableRows.forEach((row) => {
    let cells = row.querySelectorAll("td");
    if (!cells[0].querySelector("em")) {
      let album = {
        name: cells[0].textContent.trim(),
        type: cells[1].textContent.trim(),
        year: cells[2].textContent.trim(),
      };
      discography.push(album);
    }
  });
  return discography;
}
