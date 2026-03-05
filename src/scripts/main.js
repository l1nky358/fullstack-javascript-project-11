import 'bootstrap';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import _uniqueId from 'lodash/uniqueId.js';
import { Modal } from 'bootstrap';
import resources from './locales/index.js';
import initView from './view.js';
import parseRSS from './parser.js';

class RssReader {
  constructor() {
    this.form = document.getElementById('rss-form');
    this.urlInput = document.getElementById('rss-url');
    this.feedback = document.getElementById('feedback');
    this.submitButton = document.getElementById('submit-button');
    this.feedsContainer = document.getElementById('feeds-container');
    this.postsContainer = document.getElementById('posts-container');
    this.modalElement = document.getElementById('modal');
    
    this.elements = {
      form: this.form,
      urlInput: this.urlInput,
      feedback: this.feedback,
      submitButton: this.submitButton,
      feedsContainer: this.feedsContainer,
      postsContainer: this.postsContainer,
      modal: this.modalElement,
    };

    this.state = {
      form: {
        process: 'filling',
        error: null,
      },
      feeds: [],
      posts: [],
      ui: {
        visitedPosts: new Set(),
      },
    };

    this.updateTimeout = null;
    this.updateInterval = 5000;

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
        required: 'errors.required',
      },
      string: {
        url: 'errors.invalidUrl',
      },
    });
  }

  init() {
    this.watchedState = initView(this.state, this.elements, this.i18n);
    this.modal = new Modal(this.modalElement);

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    this.urlInput.addEventListener('input', () => {
      if (this.watchedState.form.error) {
        this.watchedState.form.error = null;
      }
    });

    this.postsContainer.addEventListener('click', (e) => {
      const button = e.target.closest('[data-id]');
      if (button) {
        const postId = button.dataset.id;
        this.handlePostClick(postId);
      }
    });
  }

  handlePostClick(postId) {
    const post = this.state.posts.find(p => p.id === postId);
    if (!post) return;

    if (!this.state.ui.visitedPosts.has(postId)) {
      this.watchedState.ui.visitedPosts.add(postId);
    }

    this.showModal(post);
  }

  startUpdates() {
    const update = () => {
      if (this.state.feeds.length === 0) {
        this.updateTimeout = setTimeout(update, this.updateInterval);
        return;
      }

      Promise.all(this.state.feeds.map(feed => this.checkFeedUpdates(feed)))
        .then(() => {
          this.updateTimeout = setTimeout(update, this.updateInterval);
        })
        .catch(() => {
          this.updateTimeout = setTimeout(update, this.updateInterval);
        });
    };

    this.updateTimeout = setTimeout(update, this.updateInterval);
  }

  checkFeedUpdates(feed) {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(feed.url)}&disableCache=true`;

    return axios.get(proxyUrl)
      .then(response => {
        if (response.data?.contents) {
          return response.data.contents;
        }
        throw new Error('network');
      })
      .then(data => {
        try {
          return parseRSS(data, feed.url);
        }
        catch (error) {
          throw new Error('parseError');
        }
      })
      .then(({ posts }) => {
        const existingPosts = this.state.posts.filter(p => p.feedId === feed.id);
        const existingLinks = new Set(existingPosts.map(p => p.link));
        
        const newPosts = posts
          .filter(post => !existingLinks.has(post.link))
          .map(post => ({
            ...post,
            id: _uniqueId('post_'),
            feedId: feed.id,
          }));

        if (newPosts.length > 0) {
          this.watchedState.posts = [...this.watchedState.posts, ...newPosts];
        }
      })
      .catch(error => {
        console.error(error);
      });
  }

  validateUrl(url) {
    const schema = yup.object().shape({
      url: yup.string()
        .url()
        .required()
        .test('unique', 'errors.duplicate', (value) => {
          return !this.state.feeds.some(feed => feed.url === value);
        })
    });

    return schema.validate({ url }, { abortEarly: false })
      .then(() => {
        this.watchedState.form.error = null;
        return url;
      })
      .catch((err) => {
        this.watchedState.form.error = err.errors[0];
        throw err;
      });
  }

  fetchRssFeed(url) {
    this.watchedState.form.process = 'sending';
    
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&disableCache=true`;

    return axios.get(proxyUrl)
      .then(response => {
        if (response.data?.contents) {
          return response.data.contents;
        }
        throw new Error('network');
      })
      .then(data => {
        try {
          const parsed = parseRSS(data, url);
          return parsed;
        }
        catch (error) {
          throw new Error('parseError');
        }
      })
      .then(({ feed, posts }) => {
        const feedId = _uniqueId('feed_');
        const feedWithId = { ...feed, id: feedId };
        
        const postsWithIds = posts.map(post => ({
          ...post,
          id: _uniqueId('post_'),
          feedId,
        }));

        this.watchedState.form.process = 'finished';
        
        return { feed: feedWithId, posts: postsWithIds };
      })
      .catch((error) => {
        this.watchedState.form.process = 'error';
        if (error.message === 'parseError') {
          this.watchedState.form.error = 'form.feedback.parseError';
        }
        else {
          this.watchedState.form.error = 'form.feedback.error';
        }
        throw error;
      });
  }

  addFeed({ feed, posts }) {
    this.watchedState.feeds = [...this.watchedState.feeds, feed];
    this.watchedState.posts = [...this.watchedState.posts, ...posts];
    
    this.urlInput.value = '';
    
    this.watchedState.form.process = 'success';
    this.watchedState.form.error = null;
    
    this.urlInput.focus();

    if (!this.updateTimeout) {
      this.startUpdates();
    }

    setTimeout(() => {
      this.watchedState.form.process = 'filling';
    }, 3000);
  }

  showModal(post) {
    const modalTitle = this.modalElement.querySelector('.modal-title');
    const modalBody = this.modalElement.querySelector('.modal-body');
    const modalLink = this.modalElement.querySelector('.modal-footer a');
    
    modalTitle.textContent = post.title;
    modalBody.textContent = post.description;
    modalLink.href = post.link;
    
    this.modal.show();
  }

  handleSubmit() {
    const url = this.urlInput.value.trim();

    this.validateUrl(url)
      .then(validatedUrl => this.fetchRssFeed(validatedUrl))
      .then(feedData => this.addFeed(feedData))
      .catch(() => {});
  }

  destroy() {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
  }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new RssReader();
  
  window.addEventListener('beforeunload', () => {
    if (app) {
      app.destroy();
    }
  });
});

export default app;
