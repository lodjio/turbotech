# lodj.io

Travel supply rebuilt from the ground up. This repo is the static site served at [lodj.io](https://lodj.io).

## Structure

```
index.html              Landing page (countdown, LinkedIn, "View Demo")
demo.html               Old demo URL → redirects to flights/
results.html            Old results URL → redirects to <vertical>/results.html

flights/                ✈ Flights vertical
  index.html            Search form
  search.js             Search form logic
  results.html          Results page
  results.js            Renders flight cards
  data.js               Demo flight inventory (replace with a real feed)

hotels/                 🛏 Stays vertical (same layout as flights/)
holidays/               🌴 Holidays (flight + hotel packages; no inventory yet — shows "coming soon")
activities/             🎈 Activities vertical (no inventory yet — shows "coming soon")

assets/
  css/landing.css       Landing page styles
  css/search.css        Shared styles for every vertical's search page
  css/results.css       Shared styles for every vertical's results page
  js/verticals.js       List of verticals → drives tabs and navigation everywhere
  js/layout.js          Shared top bar, tabs, results header, explore sections
  js/theme.js           Dark / light mode
  js/autocomplete.js    Search dropdowns with * / ? wildcards + validation, date checks
  js/results-common.js  URL params, summary bar, filters toggle, demo pricing helpers
  js/countdown.js       Landing page countdown

data/
  airports.js           Airports for flight search
  destinations.js       Destinations for search + featured destination cards
```

## Search fields

Every text search field uses `LODJ_AUTOCOMPLETE` (assets/js/autocomplete.js): a dropdown of
known options that supports wildcards (`Du*`, `*bai`, `D?B`). A search only goes through when
every field holds one of the options (a unique wildcard match is accepted automatically) and
the dates are valid.

## Adding a new vertical (e.g. transfers)

1. Add `{ id: 'transfers', path: 'transfers', label: 'Transfers', icon: '🚐' }` to `assets/js/verticals.js`
   (and remove it from `LODJ_UPCOMING_SERVICES` in the same file).
2. Copy `hotels/` to `transfers/`, set `data-vertical="transfers"` on both pages' `<body>`,
   and change the form, `data.js` and card rendering in `results.js`.

The tabs and navigation pick it up automatically.

## Running locally

Any static server works, e.g. `npx serve .` or `python3 -m http.server`, then open http://localhost:8000.
