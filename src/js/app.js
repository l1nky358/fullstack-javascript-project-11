import { proxy } from 'valtio'
import i18next from './locales.js'
import initView from './initView.js'
import fetchRss from './httpClient.js'
import parseRss from './rssParser.js'
import validate from './validate.js';
const state = proxy({
  form: {
    valid: true,
    error: null,
    status: 'filling',
  },
  feeds: [],
  posts: [],
  uiState: {
    viewedPosts: [],
    modalPostId: null,
  },
});

let idCounter = 0;
const generateId = () => {
  idCounter += 1;
  return idCounter
}

const addFeed = (url, watchedState) => {
  return fetchRss(url)
    .then((xmlString) => parseRss(xmlString, url))
    .then(data => {
      const feedId = generateId();
      
      const newFeed = { ...data.feed, id: feedId, url };
      watchedState.feeds.push(newFeed);
      const newPosts = data.posts.map((post) => ({
        ...post,
        id: generateId(),
        feedId,
      }));
      
      watchedState.posts = [...watchedState.posts, ...newPosts];
      
      return data;
    })
    .catch((err) => {
      if (err.message === 'errors.invalidRss') {
        throw new Error(i18next.t('errors.invalidRss'));
      }
      throw new Error(i18next.t('errors.network'));
    });
};

const app = () => {
  const watchedState = initView(state);
  
  const form = document.querySelector('.rss-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    
    const existingUrls = watchedState.feeds.map((feed) => feed.url);
    
    watchedState.form.status = 'sending';
    watchedState.form.valid = true;
    watchedState.form.error = null;
    
    validate(url, existingUrls)
      .then(() => addFeed(url, watchedState))
      .then(() => {
        watchedState.form.status = 'finished';
      })
      .catch((err) => {
        watchedState.form.valid = false;
        watchedState.form.error = err.message;
        watchedState.form.status = 'failed';
      });
  });
};

app();

export default app;
