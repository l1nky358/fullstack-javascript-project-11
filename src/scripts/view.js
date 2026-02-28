import onChange from 'on-change';

const render = (state, elements, i18n) => {
  const { form, feedback, urlInput, submitButton, feedsContainer } = elements;

  if (state.form.error) {
    urlInput.classList.add('is-invalid');
    feedback.textContent = i18n.t(state.form.error);
    feedback.classList.add('invalid-feedback');
    feedback.classList.remove('text-success', 'text-info');
  }
   else {
    urlInput.classList.remove('is-invalid');
    feedback.textContent = '';
    feedback.classList.remove('invalid-feedback');
  }

  if (state.form.process === 'sending') {
    submitButton.disabled = true;
    feedback.textContent = i18n.t('form.feedback.loading');
    feedback.classList.add('text-info');
    feedback.classList.remove('invalid-feedback', 'text-success');
  }
   else if (state.form.process === 'finished') {
    submitButton.disabled = false;
  }
   else if (state.form.process === 'error') {
    submitButton.disabled = false;
  }
   else if (state.form.process === 'success') {
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

  const feedsHtml = state.feeds.map(feed => `
    <div class="card mb-3 feeds-item">
      <div class="card-body">
        <h5 class="card-title">${feed.title}</h5>
        <p class="card-text text-muted small">${feed.description}</p>
        <h6 class="mt-3">${i18n.t('feeds.posts')}</h6>
        <ul class="list-unstyled">
          ${feed.posts.map(post => `
            <li class="mb-2">
              <a href="${post.link}" target="_blank" class="text-decoration-none">
                ${post.title}
              </a>
              <small class="text-muted d-block">${post.description.substring(0, 100)}...</small>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `).join('');

  feedsContainer.innerHTML = feedsHtml || `<p class="text-center text-muted">${i18n.t('feeds.empty')}</p>`;
};

export default (state, elements, i18n) => onChange(state, () => {
  render(state, elements, i18n);
});