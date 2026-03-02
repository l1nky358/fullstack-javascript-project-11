import 'bootstrap';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import _uniqueId from 'lodash/uniqueId.js';
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
    
    this.elements = {
      form: this.form,
      urlInput: this.urlInput,
      feedback: this.feedback,
      submitButton: this.submitButton,
      feedsContainer: this.feedsContainer,
      postsContainer: this.postsContainer,
    };

    this.state = {
      form: {
        process: 'filling',
        error: null,
        valid: true,
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

    this.postsContainer.addEventListener('click', (e) => {
      if (e.target.dataset.bsTarget === '#postModal') {
        const postId = e.target.dataset.postId;
        const post = this.state.posts.find(p => p.id === postId);
        if (post) {
          this.watchedState.ui.visitedPosts.add(postId);
        }
        this.showModal(post);
      }
    });
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
        } catch (error) {
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
            visited: false,
          }));

        if (newPosts.length > 0) {
          this.watchedState.posts = [...this.watchedState.posts, ...newPosts];
        }
      })
      .catch(error => {
        console.error(`Error updating feed ${feed.url}:`, error);
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
          return parseRSS(data, url);
        } catch (error) {
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
          visited: false,
        }));

        this.watchedState.form.process = 'finished';
        
        return { feed: feedWithId, posts: postsWithIds };
      })
      .catch((error) => {
        this.watchedState.form.process = 'error';
        if (error.message === 'parseError') {
          this.watchedState.form.error = 'form.feedback.parseError';
        } else {
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
    this.watchedState.form.valid = true;
    this.urlInput.focus();

    if (!this.updateTimeout) {
      this.startUpdates();
    }
  }

  showModal(post) {
    const modal = document.getElementById('postModal');
    const modalTitle = document.getElementById('postModalLabel');
    const modalBody = document.getElementById('postModalBody');
    const modalLink = document.getElementById('postModalLink');
    
    if (modal && post) {
      modalTitle.textContent = post.title;
      modalBody.textContent = post.description;
      modalLink.href = post.link;
    }
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

document.addEventListener('DOMContentLoaded', () => {
  const app = new RssReader();
  
  window.addEventListener('beforeunload', () => {
    app.destroy();
  });
});