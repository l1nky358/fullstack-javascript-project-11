import onChange from 'on-change';

const addStyle = (element, style) =>
  element.classList.add(style);

const replaceContent = (container, newContent) =>
  container.replaceChildren(newContent);

const localize = (i18n, key, fallback) => i18n(key) ?? fallback;

const renderFeedback = (elements, i18n, error, process) => {
  const { feedback, urlInput } = elements;

  feedback.classList.remove('text-success', 'text-danger', 'text-info');

  let message = "";

  switch(process) {
    case 'success':
      addStyle(feedback, 'text-success');
      message = localize(i18n, 'form.feedback.success', 'RSS успешно загружен');
      break;
    case 'sending':
      addStyle(feedback, 'text-info');
      message = localize(i18n, 'form.feedback.sending', 'RSS отправляется...');
      break;
    default:
      if (error) {
        addStyle(feedback, 'text-danger');
        message = localize(i18n, error, 'Ошибка');
      }
  }

  feedback.textContent = message;
  urlInput.classList.toggle('is-invalid', !!error);
};

const renderFeeds = (elements, i18n, feeds) => {
  const { feedsContainer } = elements;

  if (!feeds.length) {
    replaceContent(feedsContainer, '');
    return;
  }

  const card = createCard(localize(i18n, 'feeds'), feeds.map(({ title, description }) => ({
    title,
    description
  })));

  replaceContent(feedsContainer, card);
};

const createCard = (title, items) => {
  const card = document.createElement('div');
  addStyle(card, 'card border-0');

  const body = document.createElement('div');
  addStyle(body, 'card-body');

  const header = document.createElement('h2');
  addStyle(header, 'card-title h4');
  header.textContent = title;

  body.appendChild(header);

  const listGroup = document.createElement('ul');
  addStyle(listGroup, 'list-group border-0 rounded-0');

  items.forEach(item => {
    const itemEl = document.createElement('li');
    addStyle(itemEl, 'list-group-item border-0 border-end-0');

    const heading = document.createElement('h3');
    addStyle(heading, 'h6 m-0');
    heading.textContent = item.title;

    const desc = document.createElement('p');
    addStyle(desc, 'm-0 small text-black-50');
    desc.textContent = item.description;

    itemEl.append(heading, desc);
    listGroup.appendChild(itemEl);
  });

  card.append(body, listGroup);
  return card;
};

const renderPosts = (elements, i18n, posts, visitedPosts) => {
  const { postsContainer } = elements;

  if (!posts.length) {
    replaceContent(postsContainer, '');
    return;
  }

  const card = createPostCard(localize(i18n, 'posts'), posts, visitedPosts);

  replaceContent(postsContainer, card);
};

const createPostCard = (title, posts, visitedPosts) => {
  const card = document.createElement('div');
  addStyle(card, 'card border-0');

  const body = document.createElement('div');
  addStyle(body, 'card-body');

  const header = document.createElement('h2');
  addStyle(header, 'card-title h4');
  header.textContent = title;

  body.appendChild(header);

  const listGroup = document.createElement('ul');
  addStyle(listGroup, 'list-group border-0 rounded-0');

  posts.forEach(post => {
    const itemEl = document.createElement('li');
    addStyle(itemEl, 'list-group-item d-flex justify-content-between align-items-start border-0 border-end-0');

    const link = document.createElement('a');
    link.href = post.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = post.title;
    link.dataset.id = post.id;
    addStyle(link, visitedPosts.has(post.id) ? 'fw-normal' : 'fw-bold');

    const button = document.createElement('button');
    addStyle(button, 'btn btn-outline-primary btn-sm');
    button.type = 'button';
    button.dataset.id = post.id;
    button.dataset.bsToggle = 'modal';
    button.dataset.bsTarget = '#modal';
    button.textContent = localize(i18n, 'preview', 'Просмотреть');

    itemEl.append(link, button);
    listGroup.appendChild(itemEl);
  });

  card.append(body, listGroup);
  return card;
};

const initView = (state, elements, i18n) => {
  const watchedState = onChange(state, (path, value) => {
    if (['form.error', 'form.process'].includes(path)) {
      renderFeedback(elements, i18n, state.form.error, state.form.process);
    }

    if (path === 'feeds') {
      renderFeeds(elements, i18n, state.feeds);
    }

    if (['posts', 'ui.visitedPosts'].includes(path)) {
      renderPosts(elements, i18n, state.posts, state.ui.visitedPosts);
    }
  });

  return watchedState;
};

export default initView;
