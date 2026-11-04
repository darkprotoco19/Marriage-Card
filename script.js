/* ===== SETTINGS (yahan apni details likhein) ===== */
const CONFIG = {
  // RSVP jawab is WhatsApp number par jayenge. Country code ke sath, bina + ke. Misal: 923001234567
  whatsappNumber: "",
  // Venue ka default search text (map isi se banega)
  mapQuery: "Grand Royal Marquee, Gulberg, Lahore, Pakistan"
};

const STORE = "weddingCard.v1";
let saved = {};
try { saved = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { saved = {}; }
saved.text = saved.text || {};
saved.img = saved.img || {};
function persist() {
  try { localStorage.setItem(STORE, JSON.stringify(saved)); }
  catch (e) { alert("Browser storage full hai, kuch photos chhoti kar ke dobara upload karein."); }
}

/* ===== Editable text ===== */
document.querySelectorAll("[data-edit]").forEach(el => {
  const id = el.dataset.edit;
  if (saved.text[id] !== undefined) el.innerHTML = saved.text[id];
  el.addEventListener("input", () => { saved.text[id] = el.innerHTML; persist(); });
});

/* ===== Photo upload (auto resize) ===== */
function resizeImage(file, max = 1400) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function setPhoto(slot, src) {
  slot.querySelector("img").src = src;
  slot.classList.add("has-img");
}
document.querySelectorAll(".photo").forEach(slot => {
  const key = slot.dataset.key;
  if (saved.img[key]) setPhoto(slot, saved.img[key]);
  const input = slot.querySelector("input[type=file]");
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      const data = await resizeImage(file, slot.classList.contains("bg") ? 1800 : 1000);
      setPhoto(slot, data);
      saved.img[key] = data;
      persist();
    } catch (e) { alert("Photo load nahi ho saki, dusri photo try karein."); }
  });
});

/* ===== Edit mode ===== */
const editBtn = document.getElementById("editToggle");
editBtn.addEventListener("click", () => {
  const on = document.body.classList.toggle("editing");
  document.querySelectorAll("[data-edit]").forEach(el => el.contentEditable = on);
  editBtn.textContent = on ? "✔ Done" : "✎ Edit Card";
  if (!on) updateMap();
});
document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("Saari edits aur photos delete ho jayengi. Pakka reset karna hai?")) {
    localStorage.removeItem(STORE);
    location.reload();
  }
});

/* ===== Map ===== */
const mapFrame = document.getElementById("mapFrame");
const dirBtn = document.getElementById("dirBtn");
function updateMap() {
  const addr = document.getElementById("venueAddress").textContent.trim();
  const name = document.querySelector("[data-edit='venue-name']").textContent.trim();
  const q = (addr || name) ? (name + ", " + addr) : CONFIG.mapQuery;
  mapFrame.src = "https://maps.google.com/maps?q=" + encodeURIComponent(q) + "&z=15&output=embed";
  dirBtn.href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(q);
}
document.getElementById("updateMap").addEventListener("click", updateMap);
updateMap();

/* ===== RSVP ===== */
const form = document.getElementById("rsvpForm");
const msg = document.getElementById("formMsg");
form.addEventListener("submit", e => {
  e.preventDefault();
  const name = form.name.value.trim();
  const guests = parseInt(form.guests.value, 10);
  const note = form.message.value.trim();
  form.name.classList.toggle("invalid", !name);
  form.guests.classList.toggle("invalid", !(guests >= 1));
  if (!name || !(guests >= 1)) {
    msg.className = "form-msg err";
    msg.textContent = "Barah-e-meharbani naam aur mehmanon ki tadaad likhein.";
    return;
  }
  // Local copy
  try {
    const list = JSON.parse(localStorage.getItem("weddingRSVP") || "[]");
    list.push({ name, guests, note, at: new Date().toISOString() });
    localStorage.setItem("weddingRSVP", JSON.stringify(list));
  } catch (err) {}

  const text = `Assalamualaikum! Main ${name} shadi mein shirkat ki tasdeeq karta/karti hoon.\nMehmanon ki tadaad: ${guests}` + (note ? `\nPaighaam: ${note}` : "");
  msg.className = "form-msg ok";
  msg.textContent = "Shukriya " + name + "! Aap ki tasdeeq mil gayi. JazakAllah 🌙";
  if (CONFIG.whatsappNumber) {
    window.open("https://wa.me/" + CONFIG.whatsappNumber + "?text=" + encodeURIComponent(text), "_blank");
  }
  form.reset();
  form.guests.value = 1;
});

/* ===== Live stars background ===== */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fields = [];

  document.querySelectorAll(".page").forEach(sec => {
    const dark = sec.classList.contains("cover") || sec.classList.contains("blessing");
    const cv = document.createElement("canvas");
    cv.className = "stars-canvas";
    sec.appendChild(cv);
    const f = { sec, cv, ctx: cv.getContext("2d"), dark, w: 0, h: 0, stars: [], shooters: [], nextShot: 1 + Math.random() * 3, visible: false };
    fields.push(f);
  });

  function build(f) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    f.w = f.sec.clientWidth;
    f.h = f.sec.clientHeight;
    f.cv.width = f.w * dpr;
    f.cv.height = f.h * dpr;
    f.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(Math.round((f.w * f.h) / (f.dark ? 4500 : 8500)), 240);
    f.stars = [];
    for (let i = 0; i < count; i++) {
      const big = Math.random() < 0.12;
      f.stars.push({
        x: Math.random() * f.w,
        y: Math.random() * f.h,
        r: big ? 1.6 + Math.random() * 1.2 : 0.5 + Math.random() * 1.1,
        base: f.dark ? 0.5 + Math.random() * 0.5 : 0.35 + Math.random() * 0.45,
        speed: 0.6 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
        vy: 0.01 + Math.random() * 0.04,
        big,
        warm: Math.random() < 0.45
      });
    }
    if (reduce) draw(f, 0);
  }

  function draw(f, t) {
    const { ctx, w, h, dark } = f;
    ctx.clearRect(0, 0, w, h);
    for (const s of f.stars) {
      if (!reduce) { s.y += s.vy; if (s.y > h + 4) { s.y = -4; s.x = Math.random() * w; } }
      const tw = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
      const a = Math.max(0.05, s.base * (0.25 + 0.75 * tw));
      const rgb = dark ? (s.warm ? "255,230,160" : "255,255,255") : (s.warm ? "184,145,60" : "15,76,58");
      ctx.fillStyle = "rgba(" + rgb + "," + a + ")";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * (0.8 + 0.4 * tw), 0, Math.PI * 2);
      ctx.fill();
      if (s.big) {            // 4-point sparkle
        const len = s.r * (3 + 3 * tw);
        ctx.strokeStyle = "rgba(" + rgb + "," + a * 0.85 + ")";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(s.x - len, s.y); ctx.lineTo(s.x + len, s.y);
        ctx.moveTo(s.x, s.y - len); ctx.lineTo(s.x, s.y + len);
        ctx.stroke();
      }
    }
    // shooting stars (dark sections only)
    if (dark && !reduce) {
      if (t > f.nextShot) {
        f.shooters.push({ x: Math.random() * w * 0.8 + w * 0.2, y: Math.random() * h * 0.4, vx: -(260 + Math.random() * 200), vy: 150 + Math.random() * 120, life: 0 });
        f.nextShot = t + 2.5 + Math.random() * 4;
      }
      for (let i = f.shooters.length - 1; i >= 0; i--) {
        const sh = f.shooters[i];
        sh.x += sh.vx * 0.016; sh.y += sh.vy * 0.016; sh.life += 0.016;
        const alpha = Math.max(0, 1 - sh.life / 1.1);
        const tx = sh.x - sh.vx * 0.18, ty = sh.y - sh.vy * 0.18;
        const g = ctx.createLinearGradient(sh.x, sh.y, tx, ty);
        g.addColorStop(0, "rgba(255,240,200," + alpha + ")");
        g.addColorStop(1, "rgba(255,240,200,0)");
        ctx.strokeStyle = g; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(tx, ty); ctx.stroke();
        if (alpha <= 0 || sh.x < -50 || sh.y > h + 50) f.shooters.splice(i, 1);
      }
    }
  }

  fields.forEach(build);
  window.addEventListener("resize", () => fields.forEach(build));
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(() => fields.forEach(build));
    fields.forEach(f => ro.observe(f.sec));
  }

  const vis = new IntersectionObserver(entries => {
    entries.forEach(en => { const f = fields.find(x => x.sec === en.target); if (f) f.visible = en.isIntersecting; });
  }, { rootMargin: "100px" });
  fields.forEach(f => vis.observe(f.sec));

  if (!reduce) {
    (function tick(ms) {
      const t = ms / 1000;
      fields.forEach(f => { if (f.visible) draw(f, t); });
      requestAnimationFrame(tick);
    })(0);
  }
})();

/* ===== Scroll reveal ===== */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("show"); io.unobserve(en.target); } });
}, { threshold: .15 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));
