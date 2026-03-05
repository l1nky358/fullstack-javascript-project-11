import onChange from 'on-change';

const render = (state, elements, i18n) => {
  const { feedback, urlInput, submitButton, feedsContainer, postsContainer } = elements;

  urlInput.classList.remove('is-invalid');
  feedback.className = 'feedback';
  feedback.textContent = '';

  if (state.form.process === 'sending') {
    submitButton.disabled = true;
    feedback.classList.add('text-info');
    feedback.textContent = i18n.t('form.feedback.loading');
  }
  else if (state.form.process === 'error' || state.form.error) {
    submitButton.disabled = false;
    urlInput.classList.add('is-invalid');
    feedback.classList.add('text-danger');
    
    if (state.form.error === 'network') {
      feedback.textContent = i18n.t('form.feedback.network');
    }
    else if (state.form.error === 'noRss') {
      feedback.textContent = i18n.t('form.feedback.noRss');
    }
    else if (state.form.error === 'invalidUrl') {
      feedback.textContent = i18n.t('form.feedback.invalidUrl');
    }
    else if (state.form.error === 'exists') {
      feedback.textContent = i18n.t('form.feedback.exists');
    }
    else {
      feedback.textContent = i18n.t(state.form.error);
    }
  }
  else if (state.form.process === 'success') {
    submitButton.disabled = false;
    urlInput.classList.remove('is-invalid');
    feedback.classList.add('text-success');
    feedback.textContent = i18n.t('form.feedback.success');
    urlInput.value = '';
    
    setTimeout(() => {
      if (state.form.process !== 'success') return;
      feedback.textContent = '';
      feedback.classList.remove('text-success');
    }, 3000);
  }
  else if (state.form.process === 'filling') {
    submitButton.disabled = false;
    urlInput.classList.remove('is-invalid');
  }

  if (state.feeds.length > 0) {
    renderFeeds(state, feedsContainer, i18n);
  }
  
  if (state.posts.length > 0) {
    renderPosts(state, postsContainer, i18n);
  }
};

const renderFeeds = (state, container, i18n) => {
  const feedsHtml = `
    <div class="card mb-3">
      <div class="card-body">
        <h2 class="card-title h5">${i18n.t('feeds.title')}</h2>
        ${state.feeds.map(feed => `
          <div class="feed mb-3">
            <h3 class="h6 fw-bold">${feed.title}</h3>
            <p>${feed.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  container.innerHTML = feedsHtml;
};

const renderPosts = (state, container, i18n) => {
  const postsHtml = `
    <div class="card">
      <div class="card-body">
        <h2 class="card-title h5">${i18n.t('posts.title')}</h2>
        <ul class="list-unstyled">
          ${state.posts.map(post => `
            <li class="post mb-2 d-flex justify-content-between align-items-start">
              <a 
                href="${post.link}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="${state.ui.visitedPosts.has(post.id) ? 'fw-normal' : 'fw-bold'}"
                data-id="${post.id}"
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
  
  container.innerHTML = postsHtml;
};

export default (state, elements, i18n) => onChange(state, () => {
  render(state, elements, i18n);
});
