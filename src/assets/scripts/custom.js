let headroom = new Headroom(document.body, {
  tolerance: {
    up: 5,
    down: 10
  }
}).init();

if ($(".carousel-data").length) {
  tns({
    container: '.carousel-data',
    controls: false,
    gutter: 48,
    loop: false,
    nav: false,
    responsive: {
      0: { items: 2 },
      768: { items: 3 },
      1200: { items: 3 },
    }
  });
}
if ($(".carousel-logos-footer").length) {
  tns({
    container: '.carousel-logos-footer',
    controls: false,
    gutter: 48,
    loop: false,
    nav: false,
    responsive: {
      0: { items: 2 },
      768: { items: 4 },
      1200: { items: 6 },
    },
  })
}

if ($("#player").length) {
  const player = new Plyr('#player');
}

AOS.init();

// You can also pass an optional settings object
// below listed default settings
AOS.init({
  // Global settings:
  disable: false, // accepts following values: 'phone', 'tablet', 'mobile', boolean, expression or function
  startEvent: 'DOMContentLoaded', // name of the event dispatched on the document, that AOS should initialize on
  initClassName: 'aos-init', // class applied after initialization
  animatedClassName: 'aos-animate', // class applied on animation
  useClassNames: false, // if true, will add content of `data-aos` as classes on scroll
  disableMutationObserver: false, // disables automatic mutations' detections (advanced)
  debounceDelay: 50, // the delay on debounce used while resizing window (advanced)
  throttleDelay: 99, // the delay on throttle used while scrolling the page (advanced)

  // Settings that can be overridden on per-element basis, by `data-aos-*` attributes:
  offset: 120, // offset (in px) from the original trigger point
  delay: 0, // values from 0 to 3000, with step 50ms
  duration: 400, // values from 0 to 3000, with step 50ms
  easing: 'ease', // default easing for AOS animations
  once: false, // whether animation should happen only once - while scrolling down
  mirror: false, // whether elements should animate out while scrolling past them
  anchorPlacement: 'top-bottom', // defines which position of the element regarding to window should trigger the animation
});

// const headroom = new Headroom(document.querySelector("body"))

function disableButton(id, toggle = true, success) {
  const btn = document.getElementById(id + '-submit');
  btn.disabled = toggle;
  let className = 'btn btn-secondary';
  switch (typeof success) {
    case 'boolean':
      className = success ? 'btn btn-success' : 'btn btn-danger'
      break;

    default:
      break;
  }
  btn.className = className;
}

function disableForm(id, disable = true, reset) {
  if (reset) {
    $('#' + id).trigger('reset');
  }
  disableButton(id, disable, reset);
  document.querySelector('#' + id + ' fieldset').disabled = disable;
}

const listenNavBarActive = () => {
  const e = document.querySelectorAll(".navbar")
    , t = document.body;
  e.forEach((function (e) {
    e.addEventListener("hide.bs.collapse", (function () {
      t.classList.remove("navbar-active")
    }
    )),
      e.addEventListener("show.bs.collapse", (function () {
        setTimeout((() => {
          t.classList.add("navbar-active")
        }
        ), 0)
      }
      ))
  }
  ))
}

(function () {

  listenNavBarActive()

  $(window).on("scroll", function () {
    let scroll = $(window).scrollTop();
    if (scroll >= 50) {
      $(".sticky").addClass("stickyadd");
    } else {
      $(".sticky").removeClass("stickyadd");
    }
  });

  // new bootstrap.ScrollSpy(document.body, {
  //   target: "#navbarCollapse",
  //   offset: 20,
  // });

  if ($(".typedjs-slogan").length) {
    const strings = {
      "fi-FI": ["ammattilaiseksi.", "freelanceriksi.", "alihankkijaksi."],
      "en-GB": ["professional.", "freelancer.", "subcontractor."]
    }
    const locale = $(".typedjs-slogan").data("slogan-locale")
    new Typed(".typedjs-slogan", {
      strings: strings[locale],
      typeSpeed: 90,
      loop: true,
      backSpeed: 30,
      backDelay: 2500,
    });
  }

  const phoneInputs = document.querySelectorAll("#yourPhone");
  if (phoneInputs.length > 0) {
    window.intlTelInputGlobals.loadUtils("https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.13/js/utils.min.js");
    Array.prototype.forEach.call(
      phoneInputs, (phoneInput) => {
        window.intlTelInput(phoneInput, {
          initialCountry: "auto",
          geoIpLookup: function (success, failure) {
            $.get("https://ipinfo.io", function () { }, "jsonp").always(function (resp) {
              const countryCode = (resp && resp.country) ? resp.country : "fi";
              success(countryCode);
            });
            // NOTE: https://imask.js.org/
            // NOTE: https://github.com/jackocnr/intl-tel-input
          },
        });
      }
    );
  }

  const url = 'https://script.google.com/macros/s/AKfycby78WXyI0fHOjhYTkIIm7FKOsecEW1bRUg-nDRc-UdT2XOEtt3m1aUsqBQJLw9ea_Ji/exec';
  const formQuestionsId = 'form-questions';
  const formQuestions = document.forms[formQuestionsId];
  if (formQuestions)
    formQuestions.addEventListener('submit', e => {
      e.preventDefault();
      const body = new FormData(formQuestions);
      disableForm(formQuestionsId, true);
      fetch(url, { method: 'POST', body })
        .then(response => {
          disableForm(formQuestionsId, false, true);
        })
        .catch(error => {
          disableForm(formQuestionsId, false, false);
          console.error('Error!', error.message)
        });
    });

  const formCustomerId = 'form-customer';
  const formCustomer = document.forms[formCustomerId];
  if (formCustomer)
    formCustomer.addEventListener('submit', e => {
      e.preventDefault();
      const body = new FormData(formCustomer);
      disableForm(formCustomerId, true);
      fetch(url, { method: 'POST', body })
        .then(response => {
          disableForm(formCustomerId, false, true);
        })
        .catch(error => {
          disableForm(formCustomerId, false, false);
          console.error('Error!', error.message)
        });
    });
})();
