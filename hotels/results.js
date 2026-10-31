// Renders hotel result cards from hotels/data.js.
const { search, seedBase, pick, urgencyTexts, discountedPrice, regularPrice, formatSAR, setHeading, escape } = window.LODJ_RESULTS;

// Work out where the customer searched: a destination ("Paris, France") or a hotel name.
const searchedHotel = window.LODJ_HOTELS.find(h => h.name === search.to);
const place = (() => {
  if (search.to === 'Trending destinations') return null;
  const where = searchedHotel ? searchedHotel.location : search.to;
  const [city, ...rest] = where.split(',').map(x => x.trim());
  return { city, label: rest.length ? `${city}, ${rest.join(', ')}` : city };
})();

// Re-home the demo hotels to the searched destination (the searched hotel stays itself, first).
const hotels = !place ? window.LODJ_HOTELS : [
  ...(searchedHotel ? [searchedHotel] : []),
  ...window.LODJ_HOTELS.filter(h => h !== searchedHotel).map(h => ({
    ...h,
    name: h.searchName.replace(/\{city\}/g, place.city),
    desc: h.searchDesc.replace(/\{city\}/g, place.city),
    location: place.label
  }))
];
const hotelDiscounts = [50, 55, 60, 65, 70, 75];

function renderHotelCard(item, index) {
  const urgency = pick(urgencyTexts, seedBase, index);
  let pricingBlock = '';

  if (item.distress) {
    const pricing = discountedPrice(1200, 6000, index, hotelDiscounts);
    pricingBlock = `
      <div>
        <div class="price-note distress">Distress Deal • ${pricing.discount}% off<br>${urgency}</div>
        <div class="strike">${formatSAR(pricing.oldPrice)}</div>
        <div class="price">${formatSAR(pricing.newPrice)}</div>
        <div class="per-unit">per night</div>
        <div class="tax-note">Simulated based on selected dates</div>
      </div>
    `;
  } else {
    const price = regularPrice(650, 2200, index);
    pricingBlock = `
      <div>
        <div class="price-note">Popular option<br>${urgency}</div>
        <div class="price">${formatSAR(price)}</div>
        <div class="per-unit">per night</div>
        <div class="tax-note">Taxes and fees included</div>
      </div>
    `;
  }

  return `
    <article class="result-card ${item.distress ? 'hotel-distress' : ''}">
      <div class="result-image">
        <img src="${item.image}" alt="${escape(item.name)}">
      </div>

      <div class="result-body">
        <div class="badge-row">
          ${item.distress ? '<div class="badge distress">Distress Deal</div>' : '<div class="badge sponsored">Sponsored</div>'}
          <div class="badge featured">Featured</div>
        </div>

        <div class="result-topline">
          <div class="rating-pill">${item.rating}</div>
        </div>

        <h2 class="result-name">${escape(item.name)}</h2>
        <div class="result-location"><strong>${escape(item.location)}</strong></div>
        <div class="result-desc">${escape(item.desc)}</div>

        <div class="chips">
          ${item.tags.map(tag => `<div class="chip">${tag}</div>`).join('')}
        </div>

        <div class="meta-line">${item.distress ? 'High urgency hotel logic active' : urgency}</div>
      </div>

      <div class="result-price">
        ${pricingBlock}
        <div class="cta-group">
          <a href="#" class="primary-btn">${item.distress ? 'Book this deal' : 'View option'}</a>
          <a href="#" class="secondary-btn">View details</a>
        </div>
      </div>
    </article>
  `;
}

const nights = (search.start !== 'Any selected date' && search.end !== 'Any selected date')
  ? Math.round((new Date(search.end) - new Date(search.start)) / 86400000)
  : null;

setHeading(
  place ? `${hotels.length} stays in ${place.city}` : `${hotels.length} hotel results`,
  place
    ? [search.start !== 'Any selected date' ? `${search.start} → ${search.end}` : null,
       nights ? `${nights} night${nights === 1 ? '' : 's'}` : null,
       search.pax || null].filter(Boolean).join(' · ') || place.label
    : 'First two hotel results are Distress Deals with stronger markdown and visible spacing between cards.');
document.getElementById('resultsContainer').innerHTML =
  hotels.map(renderHotelCard).join('');
