const target = new Date("2028-06-01T00:00:00").getTime();

setInterval(() => {
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    document.getElementById("countdown").innerText = "Launching soon";
    return;
  }

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById("countdown").innerText =
    d + "d " + h + "h " + m + "m " + s + "s";
}, 1000);
