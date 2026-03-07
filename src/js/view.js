import * as yup from 'yup';
import onChange from 'on-change';
import i18next from './locales.js';
import validate from './validate.js';
import { addFeed, state } from './app.js';

const initView = () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    feedback: document.querySelector('.feedback'),
    submitButton: document.querySelector('button[type="submit"]'),
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
    modal: {
      element: document.querySelector('#modal'),
      title: document.querySelector('.modal-title'),
      body: document.querySelector('.modal-body'),
      readFullButton: document.querySelector('.modal-footer .btn-primary'),
    },
  };

  const render = (path, currentValue, previousValue) => {
    switch (path) {
      case 'form.valid':
      case 'form.error':
        if (state.form.valid) {
          elements.input.classList.remove('is-invalid');
          elements.feedback.textContent = '';
        } else {
          elements.input.classList.add('is-invalid');
          elements.feedback.textContent = state.form.error || '';
        }
        break;

      case 'form.status':
        switch (currentValue) {
          case 'filling':
            elements.submitButton.disabled = false;
            elements.input.disabled = false;
            elements.input.focus();
            break;
          case 'sending':
            elements.submitButton.disabled = true;
            elements.input.disabled = true;
            break;
          case 'finished':
            elements.submitButton.disabled = false;
            elements.input.disabled = false;
            elements.input.value = '';
            elements.input.focus();
            elements.feedback.classList.remove('text-danger');
            elements.feedback.classList.add('text-success');
            elements.feedback.textContent = i18next.t('success');
            break;
          case 'failed':
            elements.submitButton.disabled = false;
            elements.input.disabled = false;
            break;
          default:
            break;
        }
        break;

      case 'feeds':
        renderFeeds(state.feeds, elements.feedsContainer);
        break;

      case 'posts':
        renderPosts(state.posts, elements.postsContainer, state.uiState);
        break;

      case 'uiState.modalPostId':
        if (currentValue) {
          const post = state.posts.find((p) => p.id === currentValue);
          if (post) {
            elements.modal.title.textContent = post.title;
            elements.modal.body.textContent = post.description;
            elements.modal.readFullButton.href = post.link;
          }
        }
        break;

      default:
        break;
    }
  };

  const watchedState = onChange(state, render);

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');

    const existingUrls = watchedState.feeds.map((feed) => feed.url);

    watchedState.form.status = 'sending';
    watchedState.form.valid = true;
    watchedState.form.error = null;

    validate(url, existingUrls)
      .then(() => {
        watchedState.form.valid = true;
        return addFeed(url, watchedState);
      })
      .then(() => {
        watchedState.form.status = 'finished';
      })
      .catch((err) => {
        watchedState.form.valid = false;
        watchedState.form.error = err.message;
        watchedState.form.status = 'failed';
      });
  });

  elements.postsContainer.addEventListener('click', (e) => {
    const button = e.target.closest('.preview-button');
    if (button) {
      const postId = button.dataset.id;
      if (!watchedState.uiState.viewedPosts.includes(postId)) {
        watchedState.uiState.viewedPosts.push(postId);
      }
      watchedState.uiState.modalPostId = postId;
      const modal = new bootstrap.Modal(elements.modal.element);
      modal.show();
    }
  });

  return watchedState;
};

const renderFeeds = (feeds, container) => {
  container.innerHTML = '';
  feeds.forEach((feed) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item');
    li.innerHTML = `<strong>${feed.title}</strong><br><small>${feed.description}</small>`;
    container.appendChild(li);
  });
};

const renderPosts = (posts, container, uiState) => {
  container.innerHTML = '';
  posts.forEach((post) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
    
    const isViewed = uiState.viewedPosts.includes(post.id);
    const linkClass = isViewed ? 'fw-normal' : 'fw-bold';
    
    li.innerHTML = `
      <a href="${post.link}" class="${linkClass}" target="_blank" rel="noopener noreferrer">${post.title}</a>
      <button type="button" class="btn btn-primary btn-sm preview-button" data-id="${post.id}">${i18next.t('buttons.preview')}</button>
    `;
    container.appendChild(li);
  });
};

export default initView;