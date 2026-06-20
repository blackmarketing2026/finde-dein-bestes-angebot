document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("leadForm");
  const steps = document.querySelectorAll(".form-step");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const formSection = document.getElementById("formSection");
  const loadingSection = document.getElementById("loadingSection");
  const resultsSection = document.getElementById("resultsSection");
  const modalOverlay = document.getElementById("modalOverlay");
  const successOverlay = document.getElementById("successOverlay");

  let currentStep = 1;
  const totalSteps = 4;

  // Auto-advance bei Radio-Auswahl (Schritte 1-3)
  document.querySelectorAll('.form-step[data-step="1"] input, .form-step[data-step="2"] input, .form-step[data-step="3"] input')
    .forEach(function (radio) {
      radio.addEventListener("change", function () {
        setTimeout(function () {
          if (currentStep < totalSteps) {
            goToStep(currentStep + 1);
          }
        }, 300);
      });
    });

  function goToStep(step) {
    steps.forEach(function (s) { s.classList.remove("active"); });
    document.querySelector('[data-step="' + step + '"]').classList.add("active");
    currentStep = step;
    progressFill.style.width = (step / totalSteps * 100) + "%";
    progressText.textContent = "Schritt " + step + " von " + totalSteps;
  }

  // Formular absenden
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var formData = new FormData(form);
    var data = {};
    formData.forEach(function (value, key) { data[key] = value; });

    // Daten im sessionStorage speichern
    sessionStorage.setItem("leadData", JSON.stringify(data));

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "form_submit",
      form_type: "quiz"
    });

    // Formular ausblenden, Ladeanimation zeigen
    formSection.classList.add("hidden");
    loadingSection.classList.remove("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });

    // Lade-Simulation
    var ls1 = document.getElementById("ls1");
    var ls2 = document.getElementById("ls2");
    var ls3 = document.getElementById("ls3");
    var loadingStatus = document.getElementById("loadingStatus");

    setTimeout(function () {
      ls1.classList.add("done");
      ls1.querySelector(".step-check").textContent = "✅";
      loadingStatus.textContent = "4 Anbieter in Ingolstadt gefunden...";
    }, 1200);

    setTimeout(function () {
      ls2.classList.add("done");
      ls2.querySelector(".step-check").textContent = "✅";
      loadingStatus.textContent = "Preise werden verglichen...";
    }, 2400);

    setTimeout(function () {
      ls3.classList.add("done");
      ls3.querySelector(".step-check").textContent = "✅";
      loadingStatus.textContent = "Ergebnisse sind bereit!";
    }, 3400);

    setTimeout(function () {
      loadingSection.classList.add("hidden");
      resultsSection.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
      animateResults();
    }, 4200);
  });

  // Ergebnisse nacheinander einblenden
  function animateResults() {
    var cards = resultsSection.querySelectorAll(".result-card");
    cards.forEach(function (card, i) {
      setTimeout(function () {
        card.classList.add("visible");
      }, 300 * (i + 1));
    });
  }

  // "Jetzt anfragen"-Buttons
  document.querySelectorAll(".result-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var providerName = this.closest(".result-card").querySelector("h3").textContent;
      document.getElementById("modalProvider").textContent = providerName;

      var lead = JSON.parse(sessionStorage.getItem("leadData") || "{}");
      var summaryHTML =
        "<strong>Name:</strong> " + (lead.name || "–") + "<br>" +
        "<strong>E-Mail:</strong> " + (lead.email || "–") + "<br>" +
        "<strong>Telefon:</strong> " + (lead.phone || "–") + "<br>" +
        "<strong>PLZ / Ort:</strong> " + (lead.plz || "–") + " " + (lead.city || "Ingolstadt");
      document.getElementById("modalSummary").innerHTML = summaryHTML;

      modalOverlay.classList.remove("hidden");
    });
  });

  // Modal schließen
  document.getElementById("modalClose").addEventListener("click", function () {
    modalOverlay.classList.add("hidden");
  });

  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) modalOverlay.classList.add("hidden");
  });

  // Anfrage bestätigen
  document.getElementById("modalConfirm").addEventListener("click", async function () {
    var confirmButton = this;
    var originalButtonText = confirmButton.textContent;
    confirmButton.disabled = true;
    confirmButton.textContent = "Anfrage wird gesendet...";

    var lead = JSON.parse(sessionStorage.getItem("leadData") || "{}");
    lead.provider = document.getElementById("modalProvider").textContent;
    lead.timestamp = new Date().toISOString();

    try {
      var response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead)
      });

      if (!response.ok) {
        throw new Error("Anfrage konnte nicht gesendet werden.");
      }

      modalOverlay.classList.add("hidden");
      successOverlay.classList.remove("hidden");

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "form_submit",
        form_type: "lead",
        provider: lead.provider
      });
    } catch (error) {
      console.error("Lead konnte nicht gesendet werden:", error);
      alert("Die Anfrage konnte gerade nicht gesendet werden. Bitte versuche es gleich erneut.");
    } finally {
      confirmButton.disabled = false;
      confirmButton.textContent = originalButtonText;
    }
  });

  // Erfolg schließen
  document.getElementById("successClose").addEventListener("click", function () {
    successOverlay.classList.add("hidden");
  });

  // Live-Aktivitäts-Rotation
  var activities = [
    "Gerade vergleichen 3 Personen aus Ingolstadt Angebote",
    "Max M. aus Ingolstadt hat vor 4 Min. eine Anfrage gesendet",
    "5 neue Vergleiche in der letzten Stunde",
    "Julia K. aus Ingolstadt hat gerade Angebote verglichen",
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
