import i18next from './locales.js';
import initView from './initView.js';
import fetchRss from './httpClient.js';
import parseRss from './rssParser.js';
import updatePosts from './updatePosts.js';

let idCounter = 0;
const generateId = () => {
  idCounter += 1;
  return idCounter;
};

export const state = {
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
};

export const addFeed = (url, watchedState) => {
  return fetchRss(url)
    .then((xmlString) => parseRss(xmlString, url))
    .then((data) => {
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

export const updatePostsCallback = (watchedState) => {
  const checkFeed = (feed) => {
    return fetchRss(feed.url)
      .then((xmlString) => parseRss(xmlString, feed.url))
      .then((data) => {
        const existingPosts = watchedState.posts.filter((p) => p.feedId === feed.id);
        const existingLinks = existingPosts.map((p) => p.link);
        
        const newPosts = data.posts
          .filter((post) => !existingLinks.includes(post.link))
          .map((post) => ({
            ...post,
            id: generateId(),
            feedId: feed.id,
          }));
        
        if (newPosts.length > 0) {
          watchedState.posts = [...watchedState.posts, ...newPosts];
        }
      })
      .catch((err) => {
        console.error('Update error:', err);
      });
  };

  return Promise.all(watchedState.feeds.map(checkFeed))
    .finally(() => {
      setTimeout(() => updatePostsCallback(watchedState), 5000);
    });
};

const app = () => {
  const watchedState = initView();
  
  setTimeout(() => {
    updatePostsCallback(watchedState);
  }, 5000);
};

app();