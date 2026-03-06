import onChange from 'on-change';

const renderFeedback = (elements, i18n, error, process) => {
  const { feedback, urlInput } = elements;
  
  feedback.classList.remove('text-success', 'text-danger', 'text-info');
  
  const t = (key, fallback) => {
    try {
      const v = i18n(key);
      return v && v !== key ? v : fallback;
    } catch {
      return fallback;
    }
  };

  if (process === 'success') {
    feedback.classList.add('text-success');
    feedback.textContent = t('form.feedback.success', 'RSS успешно загружен');
    urlInput.classList.remove('is-invalid');
  } 
  else if (error) {
    feedback.classList.add('text-danger');
    feedback.textContent = t(error, 'Ошибка');
    urlInput.classList.add('is-invalid');
  } 
  else if (process === 'sending') {
    feedback.classList.add('text-info');
    feedback.textContent = t('form.feedback.sending', 'RSS отправляется…');
  } 
  else {
    feedback.textContent = '';
  }
};

const renderFeeds = (elements, i18n, feeds) => {
  const { feedsContainer } = elements;
  
  if (feeds.length === 0) {
    feedsContainer.innerHTML = '';
    return;
  }

  const feedsDiv = document.createElement('div');
  feedsDiv.classList.add('card', 'border-0');
  
  const feedsBody = document.createElement('div');
  feedsBody.classList.add('card-body');
  
  const feedsTitle = document.createElement('h2');
  feedsTitle.classList.add('card-title', 'h4');
  feedsTitle.textContent = i18n('feeds');
  
  feedsBody.append(feedsTitle);
  feedsDiv.append(feedsBody);
  
  const feedsList = document.createElement('ul');
  feedsList.classList.add('list-group', 'border-0', 'rounded-0');
  
  feeds.forEach((feed) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');
    
    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.textContent = feed.title;
    
    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.textContent = feed.description;
    
    li.append(h3, p);
    feedsList.append(li);
  });
  
  feedsDiv.append(feedsList);
  feedsContainer.innerHTML = '';
  feedsContainer.append(feedsDiv);
};

const renderPosts = (elements, i18n, posts, visitedPosts) => {
  const { postsContainer } = elements;
  
  if (posts.length === 0) {
    postsContainer.innerHTML = '';
    return;
  }

  const postsDiv = document.createElement('div');
  postsDiv.classList.add('card', 'border-0');
  
  const postsBody = document.createElement('div');
  postsBody.classList.add('card-body');
  
  const postsTitle = document.createElement('h2');
  postsTitle.classList.add('card-title', 'h4');
  postsTitle.textContent = i18n('posts');
  
  postsBody.append(postsTitle);
  postsDiv.append(postsBody);
  
  const postsList = document.createElement('ul');
  postsList.classList.add('list-group', 'border-0', 'rounded-0');
  
  posts.forEach((post) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    
    const link = document.createElement('a');
    link.href = post.link;
    link.classList.add(visitedPosts.has(post.id) ? 'fw-normal' : 'fw-bold');
    link.setAttribute('data-id', post.id);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    link.textContent = post.title;
    
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('data-id', post.id);
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    button.textContent = i18n('preview');
    
    li.append(link, button);
    postsList.append(li);
  });
  
  postsDiv.append(postsList);
  postsContainer.innerHTML = '';
  postsContainer.append(postsDiv);
};

const initView = (state, elements, i18n) => {
  const watchedState = onChange(state, (path, value) => {
    if (path === 'form.error' || path === 'form.process') {
      renderFeedback(elements, i18n, state.form.error, state.form.process);
    }
    
    if (path === 'feeds') {
      renderFeeds(elements, i18n, state.feeds);
    }
    
    if (path === 'posts' || path === 'ui.visitedPosts') {
      renderPosts(elements, i18n, state.posts, state.ui.visitedPosts);
    }
  });

  return watchedState;
};

export default initView;
