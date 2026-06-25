document.addEventListener("DOMContentLoaded", function () {
  var steps = document.querySelectorAll(".q-step");
  var progressFill = document.getElementById("progressFill");
  var progressLabel = document.getElementById("progressLabel");
  var backBtn = document.getElementById("backBtn");
  var currentStep = 1;
  var totalSteps = 7;

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

  // Step 5: advance when both etage_alt AND aufzug_alt are selected
  var step5radios = document.querySelectorAll('.q-step[data-step="5"] input[type="radio"]');
  step5radios.forEach(function (radio) {
    radio.addEventListener("change", function () {
      var etage = document.querySelector('input[name="etage_alt"]:checked');
      var aufzug = document.querySelector('input[name="aufzug_alt"]:checked');
      if (etage && aufzug) {
        setTimeout(function () { goToStep(6); }, 280);
      }
    });
  });

  // Step 6: advance when both etage_neu AND aufzug_neu are selected
  var step6radios = document.querySelectorAll('.q-step[data-step="6"] input[type="radio"]');
  step6radios.forEach(function (radio) {
    radio.addEventListener("change", function () {
      var etage = document.querySelector('input[name="etage_neu"]:checked');
      var aufzug = document.querySelector('input[name="aufzug_neu"]:checked');
      if (etage && aufzug) {
        setTimeout(function () { goToStep(7); }, 280);
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

    sessionStorage.setItem("umzugQuizData", JSON.stringify(quizData));

    window.location.href = "/umzugsangebote-ergebnisse";
  });

  // Live activity rotation
  var activities = [
    "Gerade vergleichen 7 Personen Umzugsangebote",
    "Lisa S. hat vor 2 Min. eine Anfrage gesendet",
    "12 neue Vergleiche in der letzten Stunde",
    "Marco R. hat gerade Umzugsangebote verglichen",
    "Meisterwerk wurde 18x heute angefragt"
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
