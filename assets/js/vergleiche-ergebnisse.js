document.addEventListener("DOMContentLoaded", function () {

  // Load quiz data from sessionStorage and display summary tags
  var quizData = JSON.parse(sessionStorage.getItem("vglQuizData") || "{}");
  var summaryEl = document.getElementById("quizSummary");

  var labels = {
    objekt: { wohnung: "Wohnung", haus: "Haus", keller: "Keller", dachboden: "Dachboden", garage: "Garage", gewerbe: "Gewerbe" },
    flaeche: { "bis-30": "Bis 30 m²", "30-70": "30–70 m²", "70-120": "70–120 m²", "ueber-120": "Über 120 m²" },
    fuellgrad: { wenig: "Wenig gefüllt", mittel: "Mittel gefüllt", voll: "Voll" },
    zeitraum: { sofort: "So schnell wie möglich", "2-wochen": "In 1–2 Wochen", monat: "Innerhalb 1 Monat", flexibel: "Flexibel" },
    etage: { eg: "Erdgeschoss", "1og": "1. OG", "2og": "2. OG", "3plus": "3. OG+" },
    aufzug: { ja: "Aufzug vorhanden", nein: "Kein Aufzug" }
  };

  if (summaryEl && Object.keys(quizData).length > 0) {
    var keys = ["objekt", "flaeche", "fuellgrad", "zeitraum", "etage", "aufzug"];
    keys.forEach(function (key) {
      if (quizData[key] && labels[key] && labels[key][quizData[key]]) {
        var tag = document.createElement("span");
        tag.className = "quiz-tag";
        tag.textContent = labels[key][quizData[key]];
        summaryEl.appendChild(tag);
      }
    });

    var extras = quizData.extras;
    if (extras) {
      var extrasArr = Array.isArray(extras) ? extras : [extras];
      var extrasLabels = { besenrein: "Besenrein", entsorgung: "Entsorgungsnachweis", wertanrechnung: "Wertanrechnung", besichtigung: "Besichtigung" };
      extrasArr.forEach(function (ex) {
        if (extrasLabels[ex]) {
          var tag = document.createElement("span");
          tag.className = "quiz-tag";
          tag.textContent = extrasLabels[ex];
          summaryEl.appendChild(tag);
        }
      });
    }
  }

  // Animate cards in one by one
  var animCards = document.querySelectorAll(".anim-card");
  var resultsCount = document.getElementById("resultsCount");

  function animateCardsIn() {
    if (resultsCount) {
      resultsCount.classList.remove("hidden");
    }
    animCards.forEach(function (card, i) {
      setTimeout(function () {
        card.classList.add("visible");
      }, 400 + i * 350);
    });
  }

  setTimeout(animateCardsIn, 300);

  // If no quiz data, redirect back
  if (Object.keys(quizData).length === 0) {
    var resultsSection = document.getElementById("resultsSection");
    if (resultsSection) {
      resultsSection.innerHTML =
        '<div style="text-align:center;padding:3rem 1rem;">' +
        '<p style="margin-bottom:1rem;color:var(--color-text-light);">Es wurden keine Quiz-Daten gefunden.</p>' +
        '<a href="/entruempelungsangebote-vergleiche" class="btn btn-primary">Zum Fragebogen</a>' +
        '</div>';
    }
    return;
  }

  // Contact modal
  var selectedProvider = null;
  var modal = document.getElementById("contactModal");
  var modalProvider = document.getElementById("modalProvider");

  // Attach click handlers to all CTA buttons
  document.querySelectorAll('[data-action="contact"]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = this.closest(".provider-card");
      selectedProvider = {
        id: card.dataset.providerId,
        name: card.dataset.providerName
      };

      var logoEl = card.querySelector(".provider-logo img");
      var logoText = card.querySelector(".provider-logo-text");
      var ratingEl = card.querySelector(".provider-rating");

      var provHtml = '';
      if (logoEl) {
        provHtml += '<img src="' + logoEl.src + '" alt="' + selectedProvider.name + '">';
      } else if (logoText) {
        provHtml += '<div class="provider-logo-text" style="width:40px;height:40px;font-size:0.8rem;">' + logoText.textContent + '</div>';
      }
      provHtml += '<div class="modal-prov-text">';
      provHtml += '<strong>' + selectedProvider.name + '</strong>';
      if (ratingEl) {
        provHtml += '<span>' + ratingEl.textContent.trim() + '</span>';
      }
      provHtml += '</div>';
      modalProvider.innerHTML = provHtml;

      modal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    });
  });

  // Close modal
  document.getElementById("modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });

  function closeModal() {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  // Submit contact form
  document.getElementById("contactForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    var submitBtn = document.getElementById("submitBtn");
    var originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Wird gesendet...";

    var contactData = {};
    new FormData(this).forEach(function (val, key) { contactData[key] = val; });

    var lead = {
      quiz: quizData,
      contact: contactData,
      provider: selectedProvider ? selectedProvider.name : "unbekannt",
      providerId: selectedProvider ? selectedProvider.id : "",
      source: "entruempelungsangebote-vergleiche",
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

      closeModal();
      document.getElementById("successOverlay").classList.remove("hidden");
      document.getElementById("contactForm").reset();

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "form_submit",
        form_type: "lead",
        form_page: "entruempelungsangebote-ergebnisse",
        provider: lead.provider
      });
    } catch (error) {
      console.error("Lead konnte nicht gesendet werden:", error);
      alert("Die Anfrage konnte gerade nicht gesendet werden. Bitte versuche es gleich erneut.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // Success close
  document.getElementById("successClose").addEventListener("click", function () {
    document.getElementById("successOverlay").classList.add("hidden");
  });
});
