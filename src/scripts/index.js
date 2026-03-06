import 'bootstrap';
import * as yup from 'yup';
import axios from 'axios';
import _uniqueId from 'lodash/uniqueId.js';
import { Modal } from 'bootstrap';
import initI18n from './init.js';
import initView from './view.js';
import parseRss from './parser.js';

const validateUrl = (url, feeds) => {
  const schema = yup.string()
    .url('invalidUrl')
    .required('required')
    .test('unique', 'duplicate', (value) => !feeds.some(feed => feed.url === value));

  return schema.validate(url);
};

const fetchRss = (url) => {
  const proxyUrl = `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}&disableCache=true`;
  return axios.get(proxyUrl, { timeout: 10000 })
    .then(response => response.data.contents);
};

const app = async () => {
  const i18n = await initI18n();

  const elements = {
    input: document.getElementById('rss-url'),
    feedback: document.getElementById('feedback'),
    submitButton: document.getElementById('submit-button'),
    feedsContainer: document.getElementById('feeds-container'),
    postsContainer: document.getElementById('posts-container'),
    modal: document.getElementById('modal'),
    modalTitle: document.querySelector('.modal-title'),
    modalBody: document.querySelector('.modal-body'),
    modalLink: document.querySelector('.modal-footer a'),
  };

  const modal = new Modal(elements.modal);

  const state = {
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

  const watchedState = initView(state, elements, i18n);

  document.getElementById('rss-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');

    validateUrl(url, state.feeds)
      .then((validatedUrl) => {
        watchedState.form.process = 'sending';
        watchedState.form.error = null;
        return fetchRss(validatedUrl);
      })
      .then((data) => {
        try {
          const { feed, posts } = parseRss(data);
          const feedId = _uniqueId('feed_');
          const feedWithId = { ...feed, url, id: feedId };
          const postsWithIds = posts.map(post => ({
            ...post,
            id: _uniqueId('post_'),
            feedId,
          }));

          watchedState.feeds.push(feedWithId);
          watchedState.posts.push(...postsWithIds);
          watchedState.form.process = 'success';
          watchedState.form.error = null;
          elements.input.value = '';
          elements.input.focus();
        } catch (parseError) {
          watchedState.form.process = 'error';
          watchedState.form.error = i18n.t('errors.noRss');
        }
      })
      .catch((error) => {
        watchedState.form.process = 'error';
        if (error.message === 'network') {
          watchedState.form.error = i18n.t('errors.network');
        } else if (error.message) {
          watchedState.form.error = i18n.t(`errors.${error.message}`);
        } else {
          watchedState.form.error = i18n.t('errors.network');
        }
      });
  });

  elements.postsContainer.addEventListener('click', (e) => {
    const button = e.target.closest('[data-id]');
    if (button) {
      const postId = button.dataset.id;
      const post = state.posts.find(p => p.id === postId);
      if (post) {
        if (!state.ui.visitedPosts.has(postId)) {
          watchedState.ui.visitedPosts.add(postId);
        }
        elements.modalTitle.textContent = post.title;
        elements.modalBody.textContent = post.description;
        elements.modalLink.href = post.link;
        modal.show();
      }
    }
  });

  const updatePosts = () => {
    if (state.feeds.length === 0) {
      setTimeout(updatePosts, 5000);
      return;
    }

    const promises = state.feeds.map(feed => 
      fetchRss(feed.url)
        .then(data => {
          try {
            const { posts } = parseRss(data);
            const existingPosts = state.posts.filter(p => p.feedId === feed.id);
            const existingLinks = new Set(existingPosts.map(p => p.link));
            
            const newPosts = posts
              .filter(post => !existingLinks.has(post.link))
              .map(post => ({
                ...post,
                id: _uniqueId('post_'),
                feedId: feed.id,
              }));

            if (newPosts.length > 0) {
              watchedState.posts.push(...newPosts);
            }
          } catch (error) {
            console.error(error);
          }
        })
        .catch(console.error)
    );

    Promise.all(promises).finally(() => {
      setTimeout(updatePosts, 5000);
    });
  };

  setTimeout(updatePosts, 5000);
};

app();
