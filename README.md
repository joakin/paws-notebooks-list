# PAWS notebooks list

Some scripts to output a list of PAWS notebooks in a more browsable format.

- `index.js` does the scraping (`node index.js > out.json` to update results)
  - If you want to change the year to scrape, this is the place, it is hardcoded
- `index.cache` caches the index HTML, remove it to re-fetch it
- `node notebooks-to-wikitext.js` to generate the wikitext listings

https://www.mediawiki.org/wiki/User:JHernandez_(WMF)/2020_PAWS_notebooks for the
published version.
