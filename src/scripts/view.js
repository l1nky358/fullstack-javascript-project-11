import onChange from 'on-change';

const render = (state, elements, i18n) => {
  const { form, feedback, urlInput, submitButton, feedsContainer, postsContainer } = elements;

  if (state.form.error) {
    urlInput.classList.add('is-invalid');
    feedback.textContent = i18n.t(state.form.error);
    feedback.classList.add('invalid-feedback');
    feedback.classList.remove('text-success', 'text-info');
  } else {
    urlInput.classList.remove('is-invalid');
    feedback.textContent = '';
    feedback.classList.remove('invalid-feedback');
  }

  if (state.form.process === 'sending') {
    submitButton.disabled = true;
    feedback.textContent = i18n.t('form.feedback.loading');
    feedback.classList.add('text-info');
    feedback.classList.remove('invalid-feedback', 'text-success');
  } else if (state.form.process === 'finished') {
    submitButton.disabled = false;
  } else if (state.form.process === 'error') {
    submitButton.disabled = false;
  } else if (state.form.process === 'success') {
    submitButton.disabled = false;
    feedback.textContent = i18n.t('form.feedback.success');
    feedback.classList.add('text-success');
    feedback.classList.remove('invalid-feedback', 'text-info');
    
    setTimeout(() => {
      feedback.textContent = '';
      feedback.classList.remove('text-success');
    }, 3000);
  } else {
    submitButton.disabled = false;
  }

  const feedsHtml = `
    <div class="card mb-3">
      <div class="card-body">
        <h2 class="card-title h5">${i18n.t('feeds.title')}</h2>
        ${state.feeds.length === 0 
          ? `<p class="text-muted">${i18n.t('feeds.empty')}</p>`
          : state.feeds.map(feed => `
            <div class="mb-3">
              <h3 class="h6 fw-bold">${feed.title}</h3>
              <p class="text-muted small">${feed.description}</p>
            </div>
          `).join('')
        }
      </div>
    </div>
  `;

  const postsHtml = `
    <div class="card">
      <div class="card-body">
        <h2 class="card-title h5">${i18n.t('posts.title')}</h2>
        ${state.posts.length === 0
          ? `<p class="text-muted">${i18n.t('posts.empty')}</p>`
          : `<ul class="list-unstyled">
              ${state.posts.map(post => `
                <li class="mb-2 d-flex justify-content-between align-items-center">
                  <a href="${post.link}" target="_blank" rel="noopener noreferrer" class="${state.ui.visitedPosts.has(post.id) ? 'link-secondary' : 'fw-bold'}">
                    ${post.title}
                  </a>
                  <button 
                    type="button" 
                    class="btn btn-outline-primary btn-sm" 
                    data-bs-toggle="modal" 
                    data-bs-target="#postModal"
                    data-post-id="${post.id}"
                  >
                    ${i18n.t('posts.button')}
                  </button>
                </li>
              `).join('')}
            </ul>`
        }
      </div>
    </div>
  `;

  feedsContainer.innerHTML = feedsHtml;
  postsContainer.innerHTML = postsHtml;
};

export default (state, elements, i18n) => onChange(state, () => {
  render(state, elements, i18n);
});