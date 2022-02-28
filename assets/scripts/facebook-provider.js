import { useState, useEffect, createContext } from 'https://unpkg.com/preact?module';

export const Method = {
  GET: 'get',
  POST: 'post',
  DELETE: 'delete',
};

export default class Facebook {
  constructor(options = {}) {
    this.options = {
      domain: 'connect.facebook.net',
      version: 'v13.0',
      cookie: false,
      status: false,
      xfbml: false,
      language: 'en_US',
      frictionlessRequests: false,
      debug: false,
      chatSupport: false,
      ...options,
    };

    if (!this.options.appId) {
      throw new Error('You need to set appId');
    }

    if (!this.options.wait) {
      this.init();
    }
  }

  getAppId() {
    return this.options.appId;
  }

  async init() {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = new Promise((resolve) => {
      const {
        domain,
        language,
        debug,
        chatSupport,
        ...restOptions
      } = this.options;

      window.fbAsyncInit = () => {
        window.FB.init({
          appId: restOptions.appId,
          version: restOptions.version,
          cookie: restOptions.cookie,
          status: restOptions.status,
          xfbml: restOptions.xfbml,
          frictionlessRequests: this.frictionlessRequests,
        });

        resolve(window.FB);
      };

      if (window.document.getElementById('facebook-jssdk')) {
        return resolve(window.FB);
      }

      const js = window.document.createElement('script');
      js.id = 'facebook-jssdk';
      js.async = true;
      js.defer = true;
      js.src = `https://${domain}/${language}/sdk${chatSupport ? '/xfbml.customerchat' : ''}${debug ? '/debug' : ''}.js`;

      window.document.body.appendChild(js);
    });

    return this.loadingPromise;
  }

  async process(method, before = [], after = []) {
    const fb = await this.init();

    return new Promise((resolve, reject) => {
      fb[method](...before, (response) => {
        if (!response) {
          if (method === 'ui') return;
          reject(new Error('Response is undefined'));
        } else if (response.error) {
          const { code, type, message } = response.error;

          const error = new Error(message);
          error.code = code;
          error.type = type;

          reject(error);
        } else {
          resolve(response);
        }
      }, ...after);
    });
  }

  async ui(options) {
    return this.process('ui', [options]);
  }

  async api(path, method = Method.GET, params = {}) {
    return this.process('api', [path, method, params]);
  }

  async getProfile(params) {
    return this.api('/me', Method.GET, params);
  }
}

const FacebookContext = createContext('Facebook');

let api = null;

function FacebookProvider(props) {
  const [isReady, setReady] = useState(false)

  useEffect(() => {
    if (!props.wait) {
      this.handleInit();
    }
  }, [props.wait])

  handleInit = async () => {
    const { isReady } = this.state;
    if (isReady) {
      return api;
    }
    if (!api) {
      api = new Facebook(this.props);
    }
    await api.init();
    if (!isReady) {
      setReady(true)
    }
    return api;
  }

  const value = { isReady, handleInit, api }
  return (
    <FacebookContext.Provider value={value}>
      {props.children}
    </FacebookContext.Provider>
  );
}

export FacebookProvider