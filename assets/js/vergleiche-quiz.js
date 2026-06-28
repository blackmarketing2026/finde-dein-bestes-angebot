document.addEventListener("DOMContentLoaded", function () {
  var steps = document.querySelectorAll(".q-step");
  var progressFill = document.getElementById("progressFill");
  var progressLabel = document.getElementById("progressLabel");
  var backBtn = document.getElementById("backBtn");
  var currentStep = 1;
  var totalSteps = 6;

  function goToStep(step) {
    if (step < 1 || step > totalSteps) return;
    steps.forEach(function (s) { s.classList.remove("active"); });
    document.querySelector('.q-step[data-step="' + step + '"]').classList.add("active");
    currentStep = step;
    progressFill.style.width = (step / totalSteps * 100) + "%";
    progressLabel.textContent = "Schritt " + step + " von " + totalSteps;

    if (step === 2) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "vergleich_gestartet" });
    }

    if (step > 1) {
      backBtn.classList.remove("hidden");
    } else {
      backBtn.classList.add("hidden");
    }
  }

  // Auto-advance on radio selection (steps 1-4)
  for (var s = 1; s <= 4; s++) {
    (function (stepNum) {
      var radios = document.querySelectorAll('.q-step[data-step="' + stepNum + '"] input[type="radio"]');
      radios.forEach(function (radio) {
        radio.addEventListener("change", function () {
          setTimeout(function () { goToStep(stepNum + 1); }, 280);
        });
      });
    })(s);
  }

  // Step 5: advance when both etage AND aufzug are selected
  var step5radios = document.querySelectorAll('.q-step[data-step="5"] input[type="radio"]');
  step5radios.forEach(function (radio) {
    radio.addEventListener("change", function () {
      var etage = document.querySelector('input[name="etage"]:checked');
      var aufzug = document.querySelector('input[name="aufzug"]:checked');
      if (etage && aufzug) {
        setTimeout(function () { goToStep(6); }, 280);
      }
    });
  });

  // Back button
  backBtn.addEventListener("click", function () {
    goToStep(currentStep - 1);
  });

  // Save quiz answers to sessionStorage and redirect to results page
  document.getElementById("quizSubmitBtn").addEventListener("click", function () {
    var quizData = {};
    var inputs = document.querySelectorAll("#quizForm input:checked, #quizForm select, #quizForm textarea");
    inputs.forEach(function (el) {
      var key = el.name;
      var val = el.value;
      if (!key) return;
      if (quizData[key]) {
        if (!Array.isArray(quizData[key])) quizData[key] = [quizData[key]];
        quizData[key].push(val);
      } else {
        quizData[key] = val;
      }
    });

    sessionStorage.setItem("vglQuizData", JSON.stringify(quizData));

    window.location.href = "/entruempelungsangebote-ergebnisse";
  });

  // Live activity rotation
  var activities = [
    "Gerade vergleichen 5 Personen Entrümpelungsangebote",
    "Anna M. hat vor 3 Min. eine Anfrage gesendet",
    "8 neue Vergleiche in der letzten Stunde",
    "Thomas K. hat gerade Angebote verglichen",
    "Meisterwerk wurde 14x heute angefragt"
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
