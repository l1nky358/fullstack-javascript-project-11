import onChange from 'on-change';
import i18next from './locales.js';

const initView = (state) => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    feedback: document.querySelector('.feedback'),
    submitButton: document.querySelector('button[type="submit"]'),
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
    modal: document.querySelector('#modal'),
    modalTitle: document.querySelector('.modal-title'),
    modalBody: document.querySelector('.modal-body'),
    modalLink: document.querySelector('.modal-footer .btn-primary'),
  };

  const renderFeeds = (feeds) => {
    const feedsContainer = elements.feedsContainer;
    feedsContainer.innerHTML = '';
    
    feeds.forEach((feed) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item');
      li.innerHTML = `
        <h3>${feed.title}</h3>
        <p>${feed.description}</p>
      `;
      feedsContainer.appendChild(li);
    });
  };

  const renderPosts = (posts) => {
    const postsContainer = elements.postsContainer;
    postsContainer.innerHTML = '';
    
    posts.forEach((post) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
      
      const isViewed = state.uiState.viewedPosts.includes(post.id);
      const linkClass = isViewed ? 'fw-normal' : 'fw-bold';
      
      li.innerHTML = `
        <a href="${post.link}" class="${linkClass}" target="_blank" rel="noopener noreferrer">${post.title}</a>
        <button type="button" class="btn btn-primary btn-sm preview-button" data-id="${post.id}">${i18next.t('buttons.preview')}</button>
      `;
      
      postsContainer.appendChild(li);
    });
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'feeds':
        renderFeeds(value);
        break;
      case 'posts':
        renderPosts(value);
        break;
      case 'uiState.modalPostId':
        if (value) {
          const post = state.posts.find(p => p.id === value);
          if (post) {
            elements.modalTitle.textContent = post.title;
            elements.modalBody.textContent = post.description;
            elements.modalLink.href = post.link;
            
            const modal = new bootstrap.Modal(elements.modal);
            modal.show();
          }
        }
        break;
      default:
        break;
    }
  });

  elements.postsContainer.addEventListener('click', (e) => {
    const button = e.target.closest('.preview-button');
    if (button) {
      const postId = Number(button.dataset.id);
      
      if (!watchedState.uiState.viewedPosts.includes(postId)) {
        watchedState.uiState.viewedPosts.push(postId);
      }
      
      watchedState.uiState.modalPostId = postId;
    }
  });

  return watchedState;
};

export default initView;
