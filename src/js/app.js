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

  const renderForm = (formState) => {
    switch (formState.status) {
      case 'filling':
        elements.submitButton.disabled = false;
        elements.input.disabled = false;
        break;
      case 'sending':
        elements.submitButton.disabled = true;
        elements.input.disabled = true;
        break;
      case 'finished':
        elements.submitButton.disabled = false;
        elements.input.disabled = false;
        elements.input.value = '';
        elements.feedback.classList.remove('text-danger');
        elements.feedback.classList.add('text-success');
        elements.feedback.textContent = i18next.t('success');
        elements.input.focus();
        break;
      case 'failed':
        elements.submitButton.disabled = false;
        elements.input.disabled = false;
        break;
      default:
        break;
    }

    if (formState.valid === false) {
      elements.input.classList.add('is-invalid');
      elements.feedback.classList.remove('text-success');
      elements.feedback.classList.add('text-danger');
      elements.feedback.textContent = formState.error || '';
    } else {
      elements.input.classList.remove('is-invalid');
    }
  };

  let modalInstance = null;

  const getModalInstance = () => {
    if (!modalInstance) {
      modalInstance = new bootstrap.Modal(elements.modal);
      console.log('Создан экземпляр Bootstrap модала');
    }
    return modalInstance;
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

            const modal = getModalInstance();

            console.log(`Показать модал для поста: ${post.title}`);
            modal.show();
          }
        } else {
          if (modalInstance) {
            console.log('Скрываем модал');
            modalInstance.hide();
          }
        }
        break;
      case 'form.status':
      case 'form.valid':
      case 'form.error':
        renderForm(state.form);
        break;
      default:
        break;
    }
  });

  elements.postsContainer.addEventListener('click', (e) => {
    const button = e.target.closest('.preview-button');
    if (button) {
      const postId = Number(button.dataset.id);
      if (!state.uiState.viewedPosts.includes(postId)) {
        state.uiState.viewedPosts.push(postId);
      }
      state.uiState.modalPostId = postId;
    }
  });

  elements.modal.addEventListener('hidden.bs.modal', () => {
    console.log('Модал скрыт, сброс modalPostId');
    state.uiState.modalPostId = null;
  });

  return watchedState;
};
