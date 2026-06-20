document.addEventListener("DOMContentLoaded", function () {

  var steps = document.querySelectorAll(".quiz-step");
  var progressFill = document.getElementById("progressFill");
  var progressText = document.getElementById("progressText");
  var currentStep = 1;
  var totalSteps = 5;

  // Auto-advance Schritte 1-4
  for (var s = 1; s <= 4; s++) {
    (function(stepNum) {
      var radios = document.querySelectorAll('.quiz-step[data-step="' + stepNum + '"] input[type="radio"]');
      radios.forEach(function (radio) {
        radio.addEventListener("change", function () {
          setTimeout(function () {
            goToStep(stepNum + 1);
          }, 280);
        });
      });
    })(s);
  }

  function goToStep(step) {
    steps.forEach(function (s) { s.classList.remove("active"); });
    document.querySelector('.quiz-step[data-step="' + step + '"]').classList.add("active");
    currentStep = step;
    progressFill.style.width = (step / totalSteps * 100) + "%";
    progressText.textContent = "Schritt " + step + " von " + totalSteps;
  }

  // Quiz absenden -> KI-Animation starten
  document.getElementById("quizForm").addEventListener("submit", function (e) {
    e.preventDefault();

    var formData = new FormData(this);
    var quizData = {};
    formData.forEach(function (val, key) {
      if (quizData[key]) {
        if (!Array.isArray(quizData[key])) quizData[key] = [quizData[key]];
        quizData[key].push(val);
      } else {
        quizData[key] = val;
      }
    });
    sessionStorage.setItem("quizData", JSON.stringify(quizData));

    document.getElementById("quizSection").classList.add("hidden");
    document.getElementById("aiSection").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });

    startAISearch(quizData);
  });

  // ==========================================
  // KI-SUCHE ANIMATION
  // ==========================================
  var providers = [
    {
      id: "meisterwerk",
      name: "Meisterwerk Entrümpelung",
      logo: "MW",
      logoClass: "meisterwerk",
      rating: "4,9",
      reviews: 187,
      stars: "★★★★★",
      tags: [
        { text: "Bestpreis-Garantie", cls: "tag-green" },
        { text: "Sofort verfügbar", cls: "tag-blue" },
        { text: "Top-Bewertet", cls: "tag-gold" }
      ],
      features: ["Kostenlose Besichtigung", "Besenreine Übergabe", "Entsorgungsnachweis", "Innerhalb 48h"],
      recommended: true
    },
    {
      id: "raeum-express",
      name: "Räum Express Ingolstadt",
      logo: "RE",
      logoClass: "",
      rating: "4,2",
      reviews: 93,
      stars: "★★★★☆",
      tags: [{ text: "Schneller Service", cls: "tag-blue" }],
      features: ["Besichtigung möglich", "Entsorgung inklusive"],
      recommended: false
    },
    {
      id: "sauber-entruempelt",
      name: "Sauber & Entrümpelt GmbH",
      logo: "SE",
      logoClass: "",
      rating: "4,0",
      reviews: 64,
      stars: "★★★★☆",
      tags: [{ text: "Familienunternehmen", cls: "tag-blue" }],
      features: ["Wertanrechnung möglich", "Umweltgerechte Entsorgung"],
      recommended: false
    },
    {
      id: "koenig",
      name: "König Entrümpelung",
      logo: "KE",
      logoClass: "",
      rating: "3,7",
      reviews: 41,
      stars: "★★★☆☆",
      tags: [{ text: "Günstige Option", cls: "tag-blue" }],
      features: ["Entsorgung inklusive"],
      recommended: false
    }
  ];

  function startAISearch(quizData) {
    var terminal = document.getElementById("terminalBody");
    var resultsContainer = document.getElementById("aiResults");
    var aiStatus = document.getElementById("aiStatus");
    terminal.innerHTML = "";
    resultsContainer.innerHTML = "";

    var objektLabel = quizData.objekt || "Objekt";
    var flaecheLabel = quizData.flaeche || "";

    var terminalLines = [
      { text: "> Initialisiere KI-Anbietersuche...", cls: "info", delay: 400 },
      { text: "> Standort: Ingolstadt (Region 09)", cls: "", delay: 800 },
      { text: "> Objekt: " + objektLabel.charAt(0).toUpperCase() + objektLabel.slice(1) + " | Fläche: " + flaecheLabel, cls: "", delay: 1200 },
      { text: "> Durchsuche 47 registrierte Anbieter...", cls: "info", delay: 2000 },
      { text: "> Filter: Verfügbarkeit, Bewertungen, Leistungen...", cls: "", delay: 2800 },
      { text: "> ✓ Anbieter 1 gefunden: Meisterwerk Entrümpelung", cls: "success", delay: 4000 },
      { text: "> Suche weitere Anbieter...", cls: "info", delay: 5500 },
      { text: "> ✓ Anbieter 2 gefunden: Räum Express Ingolstadt", cls: "success", delay: 7000 },
      { text: "> Prüfe weitere Ergebnisse...", cls: "", delay: 8000 },
      { text: "> ✓ Anbieter 3 gefunden: Sauber & Entrümpelt GmbH", cls: "success", delay: 9500 },
      { text: "> Letzte Überprüfung...", cls: "info", delay: 10500 },
      { text: "> ✓ Anbieter 4 gefunden: König Entrümpelung", cls: "success", delay: 11800 },
      { text: "> ══════════════════════════════════════", cls: "", delay: 12500 },
      { text: "> Analyse abgeschlossen. 4 passende Anbieter.", cls: "highlight", delay: 13000 },
      { text: "> Empfehlung: Meisterwerk Entrümpelung (Top-Bewertet)", cls: "highlight", delay: 13500 }
    ];

    // Terminal-Zeilen tippen
    terminalLines.forEach(function (line) {
      setTimeout(function () {
        var div = document.createElement("div");
        div.className = "terminal-line " + line.cls;
        div.textContent = line.text;
        terminal.appendChild(div);
        terminal.scrollTop = terminal.scrollHeight;
      }, line.delay);
    });

    // Status-Text aktualisieren
    setTimeout(function () { aiStatus.textContent = "Anbieter werden analysiert..."; }, 2000);
    setTimeout(function () { aiStatus.textContent = "Erste Ergebnisse gefunden!"; }, 4000);
    setTimeout(function () { aiStatus.textContent = "Weitere Anbieter entdeckt..."; }, 7000);
    setTimeout(function () { aiStatus.textContent = "Analyse abgeschlossen – 4 Anbieter gefunden"; }, 13000);

    // Anbieter-Karten nacheinander "aufpoppen" + Toast
    var cardDelays = [4500, 7500, 10000, 12300];

    providers.forEach(function (prov, i) {
      setTimeout(function () {
        var card = createProviderCard(prov, i + 1);
        resultsContainer.appendChild(card);

        // Toast zeigen
        showToast("✨ Neuer Anbieter gefunden: " + prov.name);

        // Karte sichtbar machen (nach kurzer Verzögerung für DOM-Rendering)
        setTimeout(function () {
          card.classList.add("visible");
        }, 50);

        // Zur Karte scrollen
        setTimeout(function () {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);

      }, cardDelays[i]);
    });
  }

  function createProviderCard(prov, index) {
    var card = document.createElement("div");
    card.className = "ai-result-card" + (prov.recommended ? " recommended" : "");

    var html = "";

    if (prov.recommended) {
      html += '<div class="recommended-badge">⭐ Unsere Empfehlung</div>';
    }

    html += '<div class="new-badge">NEU</div>';

    html += '<div class="result-top">';
    html += '  <div class="logo-placeholder ' + prov.logoClass + '">' + prov.logo + '</div>';
    html += '  <div class="result-info">';
    html += '    <h3>' + prov.name + '</h3>';
    html += '    <div class="result-rating">';
    html += '      <span class="stars">' + prov.stars + '</span>';
    html += '      <span>' + prov.rating + ' (' + prov.reviews + ' Bewertungen)</span>';
    html += '    </div>';
    html += '    <div class="result-tags">';
    prov.tags.forEach(function (tag) {
      html += '      <span class="tag ' + tag.cls + '">' + tag.text + '</span>';
    });
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    html += '<div class="result-features">';
    prov.features.forEach(function (f) {
      html += '<span>✓ ' + f + '</span>';
    });
    html += '</div>';

    var btnClass = prov.recommended ? "btn btn-success result-btn" : "btn btn-primary result-btn";
    html += '<button class="' + btnClass + '" data-provider="' + prov.id + '">Jetzt anfragen →</button>';

    card.innerHTML = html;

    // Click-Handler für "Jetzt anfragen"
    card.querySelector(".result-btn").addEventListener("click", function () {
      openContactModal(prov);
    });

    return card;
  }

  // Toast
  var toastEl = null;
  function showToast(msg) {
    if (toastEl) toastEl.remove();
    toastEl = document.createElement("div");
    toastEl.className = "ai-toast";
    toastEl.textContent = msg;
    document.body.appendChild(toastEl);
    setTimeout(function () { toastEl.classList.add("show"); }, 50);
    setTimeout(function () {
      toastEl.classList.remove("show");
      setTimeout(function () { if (toastEl) toastEl.remove(); }, 400);
    }, 3000);
  }

  // ==========================================
  // KONTAKT-MODAL
  // ==========================================
  var selectedProvider = null;

  function openContactModal(prov) {
    selectedProvider = prov;
    document.getElementById("modalProviderName").textContent = prov.name;
    document.getElementById("modalProviderHeader").innerHTML =
      '<div style="display:flex;align-items:center;gap:0.75rem;">' +
      '<div class="logo-placeholder ' + prov.logoClass + '" style="width:40px;height:40px;font-size:0.85rem;">' + prov.logo + '</div>' +
      '<div><strong>' + prov.name + '</strong><br><span style="font-size:0.8rem;color:var(--color-text-light);">' + prov.stars + ' ' + prov.rating + '</span></div>' +
      '</div>';
    document.getElementById("contactModal").classList.remove("hidden");
  }

  document.getElementById("modalClose").addEventListener("click", function () {
    document.getElementById("contactModal").classList.add("hidden");
  });

  document.getElementById("contactModal").addEventListener("click", function (e) {
    if (e.target === this) this.classList.add("hidden");
  });

  // Kontaktformular absenden
  document.getElementById("contactForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    var submitButton = this.querySelector('button[type="submit"]');
    var originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Anfrage wird gesendet...";

    var contactData = {};
    new FormData(this).forEach(function (val, key) { contactData[key] = val; });

    var quizData = JSON.parse(sessionStorage.getItem("quizData") || "{}");

    var lead = {
      quiz: quizData,
      contact: contactData,
      provider: selectedProvider ? selectedProvider.name : "unbekannt",
      providerId: selectedProvider ? selectedProvider.id : "",
      timestamp: new Date().toISOString()
    };

    try {
      var response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead)
      });

      if (!response.ok) {
        throw new Error("Anfrage konnte nicht gesendet werden.");
      }

      document.getElementById("contactModal").classList.add("hidden");
      document.getElementById("successOverlay").classList.remove("hidden");
      this.reset();
    } catch (error) {
      console.error("Lead konnte nicht gesendet werden:", error);
      alert("Die Anfrage konnte gerade nicht gesendet werden. Bitte versuche es gleich erneut.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });

  document.getElementById("successClose").addEventListener("click", function () {
    document.getElementById("successOverlay").classList.add("hidden");
  });

  // ==========================================
  // LIVE ACTIVITY ROTATION
  // ==========================================
  var activities = [
    "Gerade vergleichen 3 Personen aus Ingolstadt Angebote",
    "Max M. aus Ingolstadt hat vor 4 Min. eine Anfrage gesendet",
    "5 neue Vergleiche in der letzten Stunde",
    "Julia K. hat gerade Angebote verglichen",
    "Meisterwerk Entrümpelung wurde 12x heute angefragt"
  ];
  var activityIndex = 0;
  var liveText = document.getElementById("liveText");

  if (liveText) {
    setInterval(function () {
      activityIndex = (activityIndex + 1) % activities.length;
      liveText.style.opacity = "0";
      setTimeout(function () {
        liveText.textContent = activities[activityIndex];
        liveText.style.opacity = "1";
      }, 300);
    }, 4000);
    liveText.style.transition = "opacity 0.3s";
  }

});
