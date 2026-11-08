/* The Hayes House preview: site chrome + multi-step stay request. */

var SITE = {
  name: "The Hayes House"
};

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('[data-site="name"]').forEach(function (el) {
    el.textContent = SITE.name;
  });

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-nav a").forEach(function (a) {
    if (a.getAttribute("href") === here) a.setAttribute("aria-current", "page");
  });

  var FORMSPREE_ID = "myeeepde";
  var form = document.getElementById("inquiry-form");
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll(".wizard-step"));
  var backBtn = document.getElementById("wizard-back");
  var nextBtn = document.getElementById("wizard-next");
  var submitBtn = document.getElementById("wizard-submit");
  var stepLabel = document.getElementById("wizard-step-label");
  var review = document.getElementById("review-summary");
  var status = document.getElementById("form-status");
  var current = 1;
  var total = steps.length || 1;
  var labels = {
    1: "Step 1 of 4: Dates",
    2: "Step 2 of 4: Guests",
    3: "Step 3 of 4: Contact",
    4: "Step 4 of 4: Review"
  };

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function petsValue() {
    var picked = form.querySelector('input[name="pets"]:checked');
    return picked ? picked.value : "";
  }

  function showStep(n) {
    current = n;
    steps.forEach(function (step) {
      var num = Number(step.getAttribute("data-step"));
      var active = num === current;
      step.hidden = !active;
      step.classList.toggle("is-active", active);
    });
    form.querySelectorAll(".wizard-dot").forEach(function (dot) {
      var num = Number(dot.getAttribute("data-dot"));
      dot.classList.toggle("is-active", num === current);
      dot.classList.toggle("is-done", num < current);
    });
    if (stepLabel) stepLabel.textContent = labels[current] || ("Step " + current + " of " + total);
    if (backBtn) backBtn.hidden = current === 1;
    if (nextBtn) nextBtn.hidden = current === total;
    if (submitBtn) submitBtn.hidden = current !== total;
    if (current === total) fillReview();
    var activeStep = form.querySelector('.wizard-step[data-step="' + current + '"]');
    var focusEl = activeStep && activeStep.querySelector("input, select, textarea, button");
    if (focusEl) focusEl.focus();
  }

  function fillReview() {
    if (!review) return;
    review.innerHTML =
      "<h4>Review your request</h4>" +
      "<ul>" +
      "<li><strong>Check-in:</strong> " + escapeHtml(val("check_in")) + "</li>" +
      "<li><strong>Check-out:</strong> " + escapeHtml(val("check_out")) + "</li>" +
      "<li><strong>Stay type:</strong> " + escapeHtml(val("stay_type")) + "</li>" +
      "<li><strong>Adults:</strong> " + escapeHtml(val("adults")) + "</li>" +
      "<li><strong>Kids:</strong> " + escapeHtml(val("kids")) + "</li>" +
      "<li><strong>Pets:</strong> " + escapeHtml(petsValue()) + "</li>" +
      "<li><strong>Name:</strong> " + escapeHtml(val("name")) + "</li>" +
      "<li><strong>Email:</strong> " + escapeHtml(val("email")) + "</li>" +
      "<li><strong>Phone:</strong> " + escapeHtml(val("phone")) + "</li>" +
      "<li><strong>Notes:</strong> " + escapeHtml(val("message") || "None") + "</li>" +
      "</ul>";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function validateStep(n) {
    var step = form.querySelector('.wizard-step[data-step="' + n + '"]');
    if (!step) return true;
    var fields = Array.prototype.slice.call(step.querySelectorAll("input, select, textarea"));
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      if (field.name === "_gotcha") continue;
      if (!field.checkValidity()) {
        field.reportValidity();
        field.focus();
        return false;
      }
    }
    if (n === 1) {
      var cin = document.getElementById("check_in");
      var cout = document.getElementById("check_out");
      if (cin && cout && cin.value && cout.value && cout.value <= cin.value) {
        cout.setCustomValidity("Check-out must be after check-in.");
        cout.reportValidity();
        cout.focus();
        return false;
      }
      if (cout) cout.setCustomValidity("");
    }
    return true;
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      if (!validateStep(current)) return;
      if (current < total) showStep(current + 1);
    });
  }
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      if (current > 1) showStep(current - 1);
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (current !== total) {
      showStep(total);
      return;
    }
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }
    var btn = submitBtn || form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    if (status) status.textContent = "Sending...";
    fetch("https://formspree.io/f/" + FORMSPREE_ID, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    }).then(function (r) {
      if (r.ok) {
        form.reset();
        showStep(1);
        if (status) status.textContent = "Thanks, your request was received. Matthew will be in touch.";
      } else if (status) {
        status.textContent = "Sorry, something went wrong. Please call 518-868-6689.";
      }
    }).catch(function () {
      if (status) status.textContent = "Sorry, something went wrong. Please call 518-868-6689.";
    }).then(function () {
      if (btn) btn.disabled = false;
      if (status) status.focus();
    });
  });

  showStep(1);
});
