const base = {
  language: document.documentElement.getAttribute('lang'),
  likeit: {
    urls: {
      fixture: '/assets/scripts/fixtures.xml',
      latest: (typeof siteUrl !== 'undefined' ? siteUrl : '') + '/assets/scripts/2022.06.25.xml',
      xml: 'https://basefi-iwdrjih2ea-lz.a.run.app/jobs-feed',
      toApply: 'http://base.likeit.fi/apply/'
    }
  },
  jobs: {
    feed: [],
    locationsFlat: [],
    locationsUnique: [],
    query: '',
    index: new FlexSearch.Document({
      tokenize: "forward",
      document: {
        id: 'id',
        index: [
          'name',
          'worktitle',
          'fieldofwork',
          'description'
        ]
      }
    })
  }
}

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  // [::1] is the IPv6 localhost address.
  window.location.hostname === '[::1]' ||
  // 127.0.0.1/8 is considered localhost for IPv4.
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/,
  ),
);
const htmlDecode = (input) => {
  var doc = new DOMParser().parseFromString(input, "text/html")
  return doc.documentElement.textContent
}
const getUrl = (mockup = isLocalhost) => mockup ? base.likeit.urls.latest : base.likeit.urls.latest // new URL(base.likeit.urls.xml)

const encodeQueryData = (params) => {
  const ret = []
  for (let p in params) {
    ret.push(encodeURIComponent(p) + '=' + encodeURIComponent(params[p]))
  }
  return ret.join('&')
}

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
})

const getApplyUrl = (id) => base.likeit.urls.toApply + id
// const getSearchUrl = (params) => '/' + base.language + '/Työntekijöille/?' + encodeQueryData(params)
const getSearchUrl = (params) => window.location.pathname + 'Työntekijöille/?' + encodeQueryData(params)
const prepareJob = (job) => ({ ...job, locations: job.locations ? job.locations.split(', ') : [] })
const fetchJobsFeed = () => {
  let headers = new Headers()
  headers.append('Content-Type', 'text/xml')
  headers.append('Accept', 'text/xml')
  fetch(
    getUrl(), {
    method: 'GET',
    headers,
  })
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(doc => {
      try {
        const offers = JSON.parse(xml2json(doc, ' '))
        if ('list' in offers && 'advert' in offers.list) {
          base.jobs.query = params.query || ''
          base.jobs.feed = [...offers.list.advert].map(prepareJob)
          base.jobs.locationsFlat = base.jobs.feed.map(j => j.locations).flat()
          base.jobs.locationsUnique = [...new Set(base.jobs.locationsFlat)].sort()
        }
        populateIndex(base.jobs.feed)
        renderScreens()
      } catch (err) {
        console.error(err)
        // throw err
      }
    }).catch(reason => console.error(reason))
};

const renderScreens = () => {
  populateHomeSearchBlock()
  populateFeedBlocks()
  populateLatestOpenings()
  populateJobListingFilter()
  populateJobListingBody()
}

const populateHomeSearchBlock = () => {
  const select = populateSelect('jobs-locations')
  const input = document.getElementById('jobs-home-search-input')
  if (!input) return

  const handleSearchFromHome = () => {
    window.location.href = getSearchUrl({ query: input.value, location: select.value })
  }

  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      handleSearchFromHome()
    }
  }

  const btn = document.getElementById('jobs-home-search-button')
  btn.onclick = handleSearchFromHome
}

const populateSelect = (target) => {
  const select = document.getElementById(target)
  if (!select) return

  const optAll = document.createElement('option')
  optAll.value = ''
  optAll.innerHTML = ' - Alueella - '
  select.appendChild(optAll)

  for (let loc of base.jobs.locationsUnique) {
    const opt = document.createElement('option')
    opt.value = opt.innerHTML = loc
    select.appendChild(opt)
  }
  return select
}

const populateIndex = (jobs) => {
  if (base.jobs.index)
    for (let job of jobs) {
      base.jobs.index.add(job)
    }
}

const renderBlockInner = ([location, count], index) => {
  let className = 'card'
  if (index > 6) {
    className += ' equal-lg-1-1'
  }
  if (index === 0 || index === 6) {
    className += ' h-100'
  }
  className += ' bg-white card-hover-border'
  return `<a href="${getSearchUrl({ location })}" class="${className}">
    <div class="card-wrap">
      <div class="card-header pb-0"><span class="text-muted">${count} openings</span></div>
      <div class="card-footer mt-auto"><h3 class="card-title">${location}</h3></div>
    </div>
  </a>`
}

const populateFeedBlocks = () => {
  const blocksCounter = document.getElementById('feed-jobs-blocks-counter')
  if (blocksCounter) {
    blocksCounter.innerText = base.jobs.feed.length
  }
  const blocks = document.getElementById('feed-jobs-blocks')
  if (!blocks) return
  let locByCount = []
  for (loc of base.jobs.locationsUnique) {
    locByCount.push([loc, base.jobs.locationsFlat.filter(f => f === loc).length])
  }
  locByCount.sort((a, b) => b[1] - a[1])
  if (locByCount.length >= 7) {
    for (let i = 0; i < 7; i++) {
      const block = document.createElement("div");
      block.setAttribute('data-aos', 'fade-up')
      if (i === 0) {
        block.className = "col-md-6 col-lg-8 col-xl-6"
      }
      else if (i >= 6) {
        block.className = 'col-md-6 col-lg-8 col-xl-3'
      }
      else {
        block.className = 'col-md-6 col-lg-4 col-xl-3'
      }
      block.setAttribute('data-aos-delay', i * 100)
      block.innerHTML = renderBlockInner(locByCount[i], i)
      blocks.appendChild(block)
    }
  }
}

const populateLatestOpenings = () => {
  const list = document.getElementById('feed-jobs-latest-openings')
  if (!list) return
  const latestJobs = [...base.jobs.feed].sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
  for (const [i, job] of latestJobs.entries()) {
    if (i > 10) break;
    const li = document.createElement("li")
    li.className = 'mt-1'
    li.innerHTML = `<a href="${getApplyUrl(job.id)}" class="card bg-white card-hover-border" target="_blank">
      <div class="card-body py-4">
        <div class="row align-items-center g-2 g-md-4 text-center text-md-start">
          <div class="col-md-9">
            <p class="fs-lg mb-0">${job.name}</p>
            <ul class="list-inline list-inline-separated text-muted">
              <li class="list-inline-item">${job.numberofperson ? job.numberofperson + ' kpl' : ''}</li>
              <li class="list-inline-item">${job.locations}</li>
            </ul>
          </div>
          <div class="col-md-3 text-lg-end">
            <span>${job.molworkdurationcat || ''}</span>
          </div>
        </div>
      </div>
    </a>`
    list.appendChild(li)
  }
}

const locationElement = ({ href = '', title = '', current = false }) => {
  const a = document.createElement("a")
  a.className = 'btn btn-filter rounded-pill px-1 px-md-3 py-1'
  if (current) {
    a.classList.add('current')
  }
  a.href = href
  a.innerHTML = title
  return a
}

const populateJobListingFilter = () => {
  const locationFilter = document.getElementById('careers-location-filter')
  if (locationFilter) {
    if (params.location) {
      locationFilter.appendChild(locationElement({
        href: window.location.pathname,
        title: '<i class="bi bi-x-lg"></i>'
      }))
    }
    base.jobs.locationsUnique.forEach(location => {
      locationFilter.appendChild(locationElement({
        href: window.location.pathname + '?' + encodeQueryData({ location }),
        title: location,
        current: params.location && params.location === location
      }))
    })
    locationFilter.after(renderSearchBlock())
  }
}

const populateJobListingBody = () => {
  const filteredJobsFeed = filterJobsByQueryParams()
  const countCareers = document.getElementById('careers-count')
  if (countCareers) {
    countCareers.innerText = filteredJobsFeed.length
  }
  const list = document.getElementById('likeitfi-offers')
  if (!list) return
  list.innerHTML = ``
  filteredJobsFeed
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    .forEach(job => {
      const div = document.createElement("div")
      div.className = 'col-12'
      div.innerHTML = `<div class="accordion-item">
        <div class="card bg-white card-hover-border"
        data-bs-toggle="collapse" data-bs-target="#accordion-job-offer-${job.id}" aria-expanded="true" aria-controls="accordion-job-offer-${job.id}"
        >
          <div class="card-body">
            <div class="row align-items-center g-2 g-md-4 text-center text-md-start">
              <div type="button" class="col-md-2 d-flex align-items-center">
              <i class="bi bi-clock me-1 fs-5 text-muted"></i>  
              ${job.molworkdurationcat || ''}
              </div>
              <div type="button" class="col-md-6">
                <p class="fs-lg mb-0">${job.name}</p>
                <ul class="list-inline list-inline-separated text-muted">
                <li class="list-inline-item">${job.fieldofwork ? job.fieldofwork.split('/').map(f => f.trim()).join(', ') : ''}</li>
                <li class="list-inline-item">${job.locations.join(', ')}<i class="bi bi-geo ms-1 text-muted"></i></li>
                </ul>
              </div>
              <div type="button" class="col-md-2 d-flex align-items-center justify-content-center">
                <i class="bi bi-person me-1 fs-5 text-muted"></i>  
                ${job.numberofperson ? job.numberofperson + ' kpl' : ''}
              </div>
              <a href="${getApplyUrl(job.id)}" target="_blank" class="col-md-2 d-flex align-items-center justify-content-center btn btn-primary px-0 py-1">
                <i class="bi bi-link me-1 fs-5 text-muted"></i>
                Hae tätä paikkaa
              </a>
            </div>
          </div>
        </div>
        <div id="accordion-job-offer-${job.id}" class="accordion-collapse collapse">
          <div class="accordion-body">
            ${htmlDecode(job.description)}
          </div>
        </div>
      </div>`
      list.appendChild(div)
    })
}

const renderSearchBlock = () => {
  const result = document.createElement("div")
  const divRow = document.createElement("div")
  const divCol9 = document.createElement("div")
  const divCol3 = document.createElement("div")
  const btn = document.createElement("button")
  const input = document.createElement("input")

  result.className = 'mt-3 grouped-inputs p-1 rounded-pill bg-white'
  divRow.className = 'row g-0'
  divCol9.className = 'col-md-9'
  divCol3.className = 'col-md-3 d-grid'

  input.id = 'careers-search-input'
  input.type = 'text'
  input.className = 'form-control form-control-lg px-4'
  input.placeholder = 'Haluttu asema'
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit()
    }
  }
  input.oninput = (e) => {
    const value = e.currentTarget.value
    if (value !== base.jobs.query) {
      base.jobs.query = value
      populateJobListingBody()
    }
  }
  input.value = params.query || ''
  divCol9.appendChild(input)

  btn.className = 'btn btn-primary btn-lg rounded-pill'
  btn.innerText = 'Etsiä'
  btn.onclick = handleSearchSubmit
  divCol3.appendChild(btn)

  divRow.appendChild(divCol9)
  divRow.appendChild(divCol3)

  result.appendChild(divRow)
  return result
}

const handleSearchSubmit = () => {
  if ('URLSearchParams' in window) {
    const searchParams = new URLSearchParams(window.location.search)
    const el = document.getElementById('careers-search-input')
    if (el) {
      searchParams.set("query", el.value)
      window.location.search = searchParams.toString()
    }
  }
}

const filterJobsByQueryParams = () => {
  let result = base.jobs.feed
  if (params.location) {
    result = base.jobs.feed.filter(j => j.locations.indexOf(params.location) !== -1)
  }
  if (base.jobs.query) {
    const search = base.jobs.index.search(base.jobs.query)
    if (Array.isArray(search)) {
      const ids = (search.map(s => s.result).flat()).filter(function (value, index, self) {
        return self.indexOf(value) === index
      })
      // console.log('length ', ids.length, 'ids: ', ids)
      result = [...result.filter(j => ids.indexOf(j.id) !== -1)]
    }
  }
  return result
}

// on Load
window.addEventListener("load", () => {
  fetchJobsFeed()
})
