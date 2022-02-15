let likeitfiContainer = null;
const tags = ["assignment", "open+position", "direct+recruiting"];
const filterBy = {
  city: true,
  country: false
}
let feedJobs = [];

// on Load
window.addEventListener("load", () => {
  // on change listener
  Array.prototype.forEach.call(
    document.querySelectorAll('input[type=radio][name="btnradio"]'),
    (radio, i) => {
      radio.addEventListener("change", onChange);
    }
  );

  // load likeitfi on load page
  likeitfiContainer = document.getElementById("likeitfi");
  if (likeitfiContainer instanceof Element) {
    loadTalentadore();
  }
});

const getTagIndex = () => {
  let result = tags[0];
  Array.prototype.forEach.call(
    document.querySelectorAll('input[type=radio][name="btnradio"]'),
    (radio) => {
      if (radio.checked) {
        result = radio.value;
        return;
      }
    }
  );
  return result;
};

const getChecked = (id) => {
  let result = [];
  Array.prototype.forEach.call(
    document.querySelectorAll('input[type=checkbox][name="' + id + '"]'),
    (el) => {
      if (el.checked) {
        result.push(el.value);
      }
    }
  );
  return result;
};

const loadTalentadore = () => {
  renderLoading();
  fetch(getTalentadoreUrl(true))
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(doc => {
      try {
        const offers = JSON.parse(xml2json(doc, ' '))
        if ('list' in offers && 'advert' in offers.list) {
          feedJobs = [...offers.list.advert]
        }
      } catch (e) {
        console.error(e)
      }
      console.log(feedJobs)
    })
  // .then((res) => res.json())
  // .then((out) => {
  //   console.log({ out })
  //   if (!("jobs" in out) || !Array.isArray(out.jobs)) {
  //     return;
  //   }
  //   feedJobs = [...out.jobs];
  //   render();
  // })
  // .catch((err) => () => {
  //   throw err;
  // });
};

const getTalentadoreUrl = (mockup = false) => {
  if (mockup) {
    return "/assets/scripts/fixtures.xml";
  }
  const taUrl = new URL("https://base.likeit.fi/servlet/XML?handler=duuni.Advert&state=-1&loginuser=guest&loginpass=vieras");
  // taUrl.searchParams.append("v", 2);
  // taUrl.searchParams.append("tags", getTagIndex());
  // taUrl.searchParams.append("display_description", "job_description");
  // taUrl.searchParams.append("categories", "tags");
  return taUrl;
};

const onChange = (e) => {
  if (e instanceof Event) {
    loadTalentadore();
  }
};

const onChangeCountry = (e) => {
  if (!e || !e.target || typeof e.target.value !== "string") return;
  const checked = getChecked("filterBy-country");
  renderEntries(
    feedJobs.filter((j) => !j.country || checked.indexOf(j.country) !== -1)
  );
};

const filterByCountry = (entries = [], country) =>
  country ? entries.filter((entry) => country === entry.country) : entries;

const renderLoading = () => {
  if (likeitfiContainer instanceof Element) {
    likeitfiContainer.innerHTML = `
      <div class="text-center mt-5 py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>`;
  }
};

const createJobElement = ({
  id,
  name,
  link,
  location,
  country,
  city,
  business_unit_name,
  // business_unit_description,
  // description_html,
  description_text,
}) => {
  const column = document.createElement("div");
  column.id = id | "";
  column.className = "col-lg-4 mb-4";
  column.innerHTML = `<div class="card h-100">
    <div class="card-body job-card">
      <h5 class="card-title">${name}</h5>
      <small class="card-subtitle mb-2 text-muted d-flex align-items-center">
        ${business_unit_name}
      </small>
      <div class="card-text">
        ${description_text}
      </div>
      <a href="${link}" target="_blank" class="btn btn-primary my-2">Details</a>
    </div>
    <div class="card-footer d-flex align-items-center">
      <span class="material-icons-round md-secondary me-2">place</span>
      <small class="text-muted">${country}, ${city}, ${location}</small>
    </div>
  </div>`;

  return column;
};

const createFormCheckBox = (id = "not-set", name = "not-set", value = "Not set", title) => {
  const input = document.createElement("input");
  input.id = name + "-" + id;
  input.name = name;
  input.value = value;
  input.checked = true;
  input.type = "checkbox";
  input.className = "form-check-input";
  input.addEventListener("input", onChangeCountry);
  input.addEventListener("propertychange", onChangeCountry);

  const label = document.createElement("label");
  label.htmlFor = input.id;
  label.className = "form-check-label text-capitalize";
  label.innerText = title || value;

  const el = document.createElement("div");
  el.className = "form-check form-check-inline";

  el.appendChild(input);
  el.appendChild(label);
  return el;
};

const renderFilters = (jobs = [], filterBy = {
  country: false,
  city: true
}) => {
  const container = document.getElementById("likeitfi-filters");
  container.innerHTML = ``;
  // By country
  if (filterBy.country) {
    const countries = jobs
      // map with empty
      .map(
        ({ country }) =>
          // typeof country !== "string" || !country ? "- Not Set -" : country
          country
      )
      .sort()
      // unique
      .filter((value, index, self) => value && self.indexOf(value) === index);
    if (countries.length <= 1) {
      return;
    }
    // jobs = filterByCountry(jobs);
    const countriesContainer = document.createElement("div");
    for (i in countries) {
      countriesContainer.appendChild(createFormCheckBox(i, 'filterBy-country', countries[i]));
    }
    container.appendChild(countriesContainer);
  }
  // By city
  if (filterBy.city) {
    const cities = jobs
      // map with empty
      .map(
        ({ city }) =>
          // typeof country !== "string" || !country ? "- Not Set -" : country
          city
      )
      .sort()
      // unique
      .filter((value, index, self) => value && self.indexOf(value) === index);
    if (cities.length <= 1) {
      return;
    }
    // jobs = country ? jobs.filter((entry) => country === entry.country) : jobs;
    const citiesContainer = document.createElement("div");
    for (i in cities) {
      citiesContainer.appendChild(createFormCheckBox(i, 'filterBy-city', cities[i]));
    }
    container.appendChild(citiesContainer);
  }

  return jobs;
};

const renderEntries = (jobs = []) => {
  const message = document.getElementById("likeitfi-message");
  if (!Array.isArray(jobs)) {
    return;
  }
  likeitfiContainer.innerHTML = ``;

  // Total
  const total = document.createElement("div");
  total.className = "py-3";
  total.innerHTML = `<span class="float-end badge rounded-pill bg-success fs-6">Total: ${jobs.length}</span>`;
  likeitfiContainer.appendChild(total);

  if (jobs.length === 0) {
    message.className = "row justify-content-center collapse show";
  } else {
    message.className = "row justify-content-center collapse";
    for (i in jobs) {
      const job = jobs[i];
      likeitfiContainer.appendChild(createJobElement(job));
    }
  }
};

const render = () => {
  renderFilters(feedJobs, filterBy);
  renderEntries(feedJobs);
};
