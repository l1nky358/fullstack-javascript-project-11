import 'bootstrap';

class RssReader {
  constructor() {
    this.form = document.getElementById('rss-form');
    this.urlInput = document.getElementById('rss-url');
    this.feedback = document.getElementById('feedback');
    this.feedsContainer = document.getElementById('feeds-container');
    this.feeds = [];

    this.init();
  }

  init() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  validateUrl(url) {
    return new Promise((resolve, reject) => {
      try {
        const urlObj = new URL(url);
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
          reject(new Error('Ссылка должна начинаться с http:// или https://'));
        } else {
          resolve(url);
        }
      } catch (error) {
        reject(new Error('Введите корректный URL адрес'));
      }
    });
  }

  checkDuplicate(url) {
    return new Promise((resolve, reject) => {
      const isDuplicate = this.feeds.some(feed => feed.url === url);
      if (isDuplicate) {
        reject(new Error('RSS поток уже добавлен'));
      } else {
        resolve(url);
      }
    });
  }

  fetchRssFeed(url) {
    this.setFeedback('Загрузка...', 'info');

    return new Promise((resolve, reject) => {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

      fetch(proxyUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('Ошибка при загрузке RSS потока');
          }
          return response.json();
        })
        .then(data => {
          const parser = new DOMParser();
          const xml = parser.parseFromString(data.contents, 'text/xml');
          
          const items = xml.querySelectorAll('item');
          const feedData = {
            url,
            title: xml.querySelector('channel > title')?.textContent || 'Без названия',
            description: xml.querySelector('channel > description')?.textContent || '',
            posts: Array.from(items).slice(0, 5).map(item => ({
              title: item.querySelector('title')?.textContent || 'Без названия',
              link: item.querySelector('link')?.textContent || '#',
              description: item.querySelector('description')?.textContent || '',
            })),
          };
          
          resolve(feedData);
        })
        .catch(error => {
          reject(new Error('Не удалось загрузить RSS поток. Проверьте ссылку.'));
        });
    });
  }

  addFeed(feedData) {
    this.feeds.push(feedData);
    this.renderFeeds();
    this.urlInput.value = '';
    this.setFeedback('RSS успешно добавлен!', 'success');
  }

  renderFeeds() {
    const feedsHtml = this.feeds.map(feed => `
      <div class="card mb-3 feeds-item">
        <div class="card-body">
          <h5 class="card-title">${feed.title}</h5>
          <p class="card-text text-muted small">${feed.description}</p>
          <h6 class="mt-3">Последние посты:</h6>
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

    this.feedsContainer.innerHTML = feedsHtml || '<p class="text-center text-muted">Пока нет добавленных RSS потоков</p>';
  }

  setFeedback(message, type) {
    this.feedback.textContent = message;
    this.feedback.className = `form-text feedback-${type}`;
    
    if (type === 'success') {
      setTimeout(() => {
        this.feedback.textContent = '';
        this.feedback.className = 'form-text';
      }, 3000);
    }
  }

  handleSubmit() {
    const url = this.urlInput.value.trim();

    this.validateUrl(url)
      .then(validatedUrl => this.checkDuplicate(validatedUrl))
      .then(uniqueUrl => this.fetchRssFeed(uniqueUrl))
      .then(feedData => this.addFeed(feedData))
      .catch(error => {
        this.setFeedback(error.message, 'error');
      });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RssReader();
});