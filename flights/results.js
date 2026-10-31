// Renders flight result cards from flights/data.js.
const { search, seedBase, pick, urgencyTexts, discountedPrice, regularPrice, formatSAR, setHeading } = window.LODJ_RESULTS;

function renderFlightCard(item, index) {
  const urgency = pick(urgencyTexts, seedBase, index + 3);
  let pricingBlock = '';

  if (item.businessBundle) {
    const fullFare = regularPrice(3800, 6200, index);
    const bundledFare = Math.round(fullFare * 0.8);
    pricingBlock = `
      <div class="badge-row">
        <div class="badge featured">Featured</div>
        <div class="badge business">Business</div>
      </div>
      <div class="price-note flight">Last 2 seats in Business Class<br>20% off only with hotel bundle</div>
      <div class="strike">${formatSAR(fullFare)}</div>
      <div class="price">${formatSAR(bundledFare)}</div>
      <div class="per-unit">with hotel bundle</div>
      <div class="tax-note">Without hotel, fare remains ${formatSAR(fullFare)}</div>
    `;
  } else if (item.featured) {
    const fare = regularPrice(900, 1800, index);
    pricingBlock = `
      <div class="badge-row">
        <div class="badge featured">Featured</div>
      </div>
      <div class="price-note flight">${urgency}</div>
      <div class="price">${formatSAR(fare)}</div>
      <div class="per-unit">per traveler</div>
      <div class="tax-note">Standard fare pricing</div>
    `;
  } else {
    const fare = regularPrice(700, 2400, index);
    pricingBlock = `
      <div class="badge-row">
        <div class="badge sponsored">Sponsored</div>
      </div>
      <div class="price-note">${urgency}</div>
      <div class="price">${formatSAR(fare)}</div>
      <div class="per-unit">per traveler</div>
      <div class="tax-note">Taxes and fees included</div>
    `;
  }

  return `
    <article class="flight-card ${item.featured ? 'featured' : ''}">
      <div class="flight-logo-col">
        <div class="airline-logo-wrap">
          <img src="${window.LODJ_AIRLINE_LOGOS(item.code)[0]}"
               data-fallbacks="${window.LODJ_AIRLINE_LOGOS(item.code).slice(1).join('|')}"
               data-code="${item.code}" alt="${item.airline} logo" loading="lazy"
               onerror="window.LODJ_LOGO_FALLBACK(this)">
        </div>
        <div class="airline-name">${item.airline}</div>
      </div>

      <div class="flight-mid">
        <div class="rating-pill">${item.rating}</div>
        <div class="flight-route">${item.route}</div>
        <div class="chips">
          ${item.tags.map(tag => `<div class="chip">${tag}</div>`).join('')}
        </div>
      </div>

      <div class="flight-meta">
        <div class="flight-class">Traveler class</div>
        <div class="flight-class-pill">${item.travelerClass}</div>
        <div class="flight-info-line">${search.pax || '1 Traveler, Economy'}</div>
        <div class="flight-info-line">${item.businessBundle ? 'Bundle incentive available' : 'Standalone fare option'}</div>
      </div>

      <div class="flight-price">
        ${pricingBlock}
        <div class="cta-group">
          <a href="#" class="primary-btn">${item.businessBundle ? 'Bundle and save' : 'View fare'}</a>
          <a href="#" class="secondary-btn">View details</a>
        </div>
      </div>
    </article>
  `;
}

setHeading(`${window.LODJ_FLIGHTS.length} flight results`,
  'Flights are now compact. First two are highlighted, one includes a Business Class hotel bundle offer.');
document.getElementById('resultsContainer').innerHTML =
  window.LODJ_FLIGHTS.map(renderFlightCard).join('');
