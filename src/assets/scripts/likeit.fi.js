const base = {
  language: document.documentElement.getAttribute('lang'),
  likeit: {
    urls: {
      fixture: '/assets/scripts/fixtures.xml',
      xml: 'https://basefi-iwdrjih2ea-lz.a.run.app/jobs-feed',
      toApply: 'http://base.likeit.fi/apply/'
    }
  },
  jobs: {
    feed: [],
    index: new FlexSearch.Document({
      id: 'id',
      index: ['name', 'worktitle', 'fieldofwork', 'description']
    })
  }
}

const htmlDecode = (input) => {
  var doc = new DOMParser().parseFromString(input, "text/html")
  return doc.documentElement.textContent
}
const getUrl = (mockup = false) => mockup ? base.likeit.urls.fixture : new URL(base.likeit.urls.xml)

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
const getSearchUrl = (params) => '/' + base.language + '/Työntekijöille/?' + encodeQueryData(params)
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
          base.jobs.feed = [...offers.list.advert].map(prepareJob)
        }
        populateIndex(base.jobs.feed)
        renderScreens(base.jobs.feed)
      } catch (err) {
        console.error(err)
        // throw err
      }
    }).catch(reason => console.error(reason))
};

const renderScreens = (jobs) => {
  const flatLocations = base.jobs.feed.map(j => j.locations).flat()
  const uniqueLocations = [...new Set(flatLocations)].sort()
  populateSelect('jobs-locations', uniqueLocations)
  populateFeedBlocks('feed-jobs-blocks', flatLocations, uniqueLocations)
  populateLatestOpenings('feed-jobs-latest-openings')
  populateJobListing(flatLocations, uniqueLocations)
}

const populateSelect = (target, values) => {
  const select = document.getElementById(target)
  if (!select) return
  for (i in values) {
    const opt = document.createElement('option')
    opt.value = values[i]
    opt.innerHTML = values[i]
    select.appendChild(opt)
  }
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

const populateFeedBlocks = (target = '', flatLoc = [], uniqLoc = []) => {
  const blocks = document.getElementById(target)
  if (!blocks) return
  let locByCount = []
  for (loc of uniqLoc) {
    locByCount.push([loc, flatLoc.filter(f => f === loc).length])
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

const populateLatestOpenings = (target = '') => {
  const list = document.getElementById(target)
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

const populateJobListing = (flatLoc = [], uniqLoc = []) => {
  const filteredJobsFeed = filterJobsByQueryParams(base.jobs.feed)
  const countCareers = document.getElementById('careers-count')
  if (countCareers) {
    countCareers.innerText = filteredJobsFeed.length
  }
  const locationFilter = document.getElementById('careers-location-filter')
  if (locationFilter) {
    if (params.location) {
      const a = document.createElement("a")
      a.className = 'btn btn-filter rounded-pill px-3 py-1'
      a.href = '?'
      a.innerHTML = `<i class="bi bi-x-lg"></i>`
      locationFilter.appendChild(a)
    }
    uniqLoc.forEach(location => {
      const a = document.createElement("a")
      a.className = 'btn btn-filter rounded-pill px-3 py-1'
      a.href = '?' + encodeQueryData({ location })
      a.innerText = location
      if (params.location && params.location === location) {
        a.classList.add('current')
      }
      locationFilter.appendChild(a)
    })
  }
  const list = document.getElementById('likeitfi-offers')
  if (!list) return
  filteredJobsFeed
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    .forEach(job => {
      const div = document.createElement("div")
      div.className = 'col-12'
      div.innerHTML = `<div class="accordion-item">
        <div type="button" class="card bg-white card-hover-border"
        data-bs-toggle="collapse" data-bs-target="#accordion-job-offer-${job.id}" aria-expanded="true" aria-controls="accordion-job-offer-${job.id}"
        >
          <div class="card-body">
            <div class="row align-items-center g-2 g-md-4 text-center text-md-start">
              <div class="col-md-2 d-flex align-items-center">
              <i class="bi bi-clock me-1 fs-5 text-muted"></i>  
              ${job.molworkdurationcat || ''}
              </div>
              <div class="col-md-6">
                <p class="fs-lg mb-0">${job.name}</p>
                <ul class="list-inline list-inline-separated text-muted">
                <li class="list-inline-item">${job.fieldofwork ? job.fieldofwork.split('/').map(f => f.trim()).join(', ') : ''}</li>
                <li class="list-inline-item">${job.locations.join(', ')}<i class="bi bi-geo ms-1 text-muted"></i></li>
                </ul>
              </div>
              <div class="col-md-2 d-flex align-items-center justify-content-center">
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

const filterJobsByQueryParams = (jobs) => {
  if (params.location) {
    return jobs.filter(j => j.locations.indexOf(params.location) !== -1)
  }
  return base.jobs.feed
}

// on Load
window.addEventListener("load", () => {
  fetchJobsFeed()
})