import onChange from 'on-change';

const renderErrors = (elements, error, i18n) => {
  const { feedback, input } = elements;
  if (error) {
    input.classList.add('is-invalid');
    feedback.classList.add('invalid-feedback');
    feedback.textContent = error;
  } else {
    input.classList.remove('is-invalid');
    feedback.classList.remove('invalid-feedback');
    feedback.textContent = '';
  }
};

const renderProcess = (elements, process, i18n) => {
  const { feedback, submitButton } = elements;
  switch (process) {
    case 'sending':
      submitButton.disabled = true;
      feedback.classList.add('text-info');
      feedback.textContent = i18n.t('form.loading');
      break;
    case 'success':
      submitButton.disabled = false;
      feedback.classList.add('text-success');
      feedback.textContent = i18n.t('form.success');
      break;
    case 'error':
      submitButton.disabled = false;
      break;
    default:
      submitButton.disabled = false;
      feedback.textContent = '';
      break;
  }
};

const renderFeeds = (elements, feeds, i18n) => {
  const { feedsContainer } = elements;
  if (feeds.length === 0) {
    feedsContainer.innerHTML = '';
    return;
  }

  const feedsHtml = `
    <div class="card mb-3">
      <div class="card-body">
        <h2 class="card-title h5">${i18n.t('feeds.title')}</h2>
        ${feeds.map(feed => `
          <div class="mb-3">
            <h3 class="h6 fw-bold">${feed.title}</h3>
            <p>${feed.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  feedsContainer.innerHTML = feedsHtml;
};

const renderPosts = (elements, posts, uiState, i18n) => {
  const { postsContainer } = elements;
  if (posts.length === 0) {
    postsContainer.innerHTML = '';
    return;
  }

  const postsHtml = `
    <div class="card">
      <div class="card-body">
        <h2 class="card-title h5">${i18n.t('posts.title')}</h2>
        <ul class="list-unstyled">
          ${posts.map(post => `
            <li class="mb-2 d-flex justify-content-between align-items-start">
              <a 
                href="${post.link}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="${uiState.visitedPosts.has(post.id) ? '' : 'fw-bold'}"
              >
                ${post.title}
              </a>
              <button 
                type="button" 
                class="btn btn-outline-primary btn-sm" 
                data-id="${post.id}"
                data-bs-toggle="modal"
                data-bs-target="#modal"
              >
                ${i18n.t('posts.button')}
              </button>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;
  postsContainer.innerHTML = postsHtml;
};

const render = (state, elements, i18n) => {
  renderErrors(elements, state.form.error, i18n);
  renderProcess(elements, state.form.process, i18n);
  renderFeeds(elements, state.feeds, i18n);
  renderPosts(elements, state.posts, state.ui, i18n);
};

export default (state, elements, i18n) => onChange(state, () => {
  render(state, elements, i18n);
});
