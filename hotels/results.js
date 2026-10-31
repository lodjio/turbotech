// Renders hotel result cards from hotels/data.js.
const { search, seedBase, pick, urgencyTexts, discountedPrice, regularPrice, formatSAR, setHeading } = window.LODJ_RESULTS;
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
        <img src="${item.image}" alt="${item.name}">
      </div>

      <div class="result-body">
        <div class="badge-row">
          ${item.distress ? '<div class="badge distress">Distress Deal</div>' : '<div class="badge sponsored">Sponsored</div>'}
          <div class="badge featured">Featured</div>
        </div>

        <div class="result-topline">
          <div class="rating-pill">${item.rating}</div>
        </div>

        <h2 class="result-name">${item.name}</h2>
        <div class="result-location"><strong>${item.location}</strong></div>
        <div class="result-desc">${item.desc}</div>

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

setHeading(`${window.LODJ_HOTELS.length} hotel results`,
  'First two hotel results are Distress Deals with stronger markdown and visible spacing between cards.');
document.getElementById('resultsContainer').innerHTML =
  window.LODJ_HOTELS.map(renderHotelCard).join('');
