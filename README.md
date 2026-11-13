# Public SNO+ Website
Overhaul of the official SNO+ Website
Currently hosted on snoplus.phy.queensu.ca/beta

Please contact benjamin.tam@physics.ox.ac.uk for suggestions or updates. 

## Recent news (front page)

The "Recent news" cards on `index.html` are built automatically by
`assets/js/news.js` from the two newest entries of each of:

- `papers.html` (publications table rows)
- `thesis.html` (theses table rows)

Add new entries at the top of those pages as usual and they appear on the
front page. To order them by exact date, add `data-date="YYYY-MM-DD"` (or
`YYYY-MM`) to the `<tr>`; without it, an entry is dated by its year and stays
above the dated rows below it.
