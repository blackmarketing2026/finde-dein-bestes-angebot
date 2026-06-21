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

  // Submit -> save to sessionStorage -> redirect to results page
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

    sessionStorage.setItem("vglQuizData", JSON.stringify(quizData));

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "form_submit",
      form_type: "quiz",
      form_page: "entruempelungsangebote-vergleiche"
    });

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
