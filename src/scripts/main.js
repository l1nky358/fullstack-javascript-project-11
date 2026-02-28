import 'bootstrap';
import * as yup from 'yup';
import i18next from 'i18next';
import resources from './locales/index.js';
import initView from './view.js';

class RssReader {
  constructor() {
    this.form = document.getElementById('rss-form');
    this.urlInput = document.getElementById('rss-url');
    this.feedback = document.getElementById('feedback');
    this.submitButton = document.getElementById('submit-button');
    this.feedsContainer = document.getElementById('feeds-container');
    
    this.elements = {
      form: this.form,
      urlInput: this.urlInput,
      feedback: this.feedback,
      submitButton: this.submitButton,
      feedsContainer: this.feedsContainer,
    };

    this.state = {
      form: {
        process: 'filling',
        error: null,
        valid: true,
      },
      feeds: [],
    };

    this.initI18n();
  }

  initI18n() {
    return i18next.init({
      lng: 'ru',
      debug: false,
      resources,
    }).then((t) => {
      this.i18n = t;
      this.initYupLocale();
      this.init();
    });
  }

  initYupLocale() {
    yup.setLocale({
      mixed: {
        required: () => ({ key: 'errors.required' }),
      },
      string: {
        url: () => ({ key: 'errors.invalidUrl' }),
      },
    });
  }

  init() {
    this.watchedState = initView(this.state, this.elements, this.i18n);

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    this.urlInput.addEventListener('input', () => {
      if (this.watchedState.form.error) {
        this.watchedState.form.error = null;
        this.watchedState.form.valid = true;
      }
    });
  }

  validateUrl(url) {
    const schema = yup.object().shape({
      url: yup.string()
        .url()
        .required()
        .test('unique', { key: 'errors.duplicate' }, (value) => {
          return !this.state.feeds.some(feed => feed.url === value);
        })
    });

    return schema.validate({ url }, { abortEarly: false })
      .then(() => {
        this.watchedState.form.error = null;
        this.watchedState.form.valid = true;
        return url;
      })
      .catch((err) => {
        this.watchedState.form.error = err.errors[0].key;
        this.watchedState.form.valid = false;
        throw err;
      });
  }

  fetchRssFeed(url) {
    this.watchedState.form.process = 'sending';
    
    return new Promise((resolve, reject) => {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

      fetch(proxyUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('Ошибка при загрузке RSS потока');
          }
          return response.json();
        })
        .then(data => {
          const parser = new DOMParser();
          const xml = parser.parseFromString(data.contents, 'text/xml');
          
          const items = xml.querySelectorAll('item');
          const feedData = {
            url,
            title: xml.querySelector('channel > title')?.textContent || 'Без названия',
            description: xml.querySelector('channel > description')?.textContent || '',
            posts: Array.from(items).slice(0, 5).map(item => ({
              title: item.querySelector('title')?.textContent || 'Без названия',
              link: item.querySelector('link')?.textContent || '#',
              description: item.querySelector('description')?.textContent || '',
            })),
          };
          
          this.watchedState.form.process = 'finished';
          resolve(feedData);
        })
        .catch(() => {
          this.watchedState.form.process = 'error';
          this.watchedState.form.error = 'form.feedback.error';
          reject(new Error('Ошибка загрузки'));
        });
    });
  }

  addFeed(feedData) {
    this.watchedState.feeds.push(feedData);
    this.urlInput.value = '';
    this.watchedState.form.process = 'success';
    this.watchedState.form.error = null;
    this.watchedState.form.valid = true;
    this.urlInput.focus();
  }

  handleSubmit() {
    const url = this.urlInput.value.trim();

    this.validateUrl(url)
      .then(validatedUrl => this.fetchRssFeed(validatedUrl))
      .then(feedData => this.addFeed(feedData))
      .catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RssReader();
});