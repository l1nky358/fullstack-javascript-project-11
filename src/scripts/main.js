import 'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';

class RssReader {
  constructor() {
    this.form = document.getElementById('rss-form');
    this.urlInput = document.getElementById('rss-url');
    this.feedback = document.getElementById('feedback');
    this.submitButton = document.getElementById('submit-button');
    this.feedsContainer = document.getElementById('feeds-container');
    this.feeds = [];

    this.state = {
      process: 'filling',
      error: null,
      valid: true
    };

    this.schema = yup.object().shape({
      url: yup.string()
        .url('Ссылка должна быть валидным URL')
        .required('Не должно быть пустым')
        .test('unique', 'RSS поток уже добавлен', (value) => {
          return !this.feeds.some(feed => feed.url === value);
        })
    });

    this.watchedState = onChange(this.state, () => {
      this.render();
    });

    this.init();
  }

  init() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    this.urlInput.addEventListener('input', () => {
      if (this.watchedState.error) {
        this.watchedState.error = null;
        this.watchedState.valid = true;
      }
    });
  }

  validateUrl(url) {
    return this.schema.validate({ url }, { abortEarly: false })
      .then(() => {
        this.watchedState.error = null;
        this.watchedState.valid = true;
        return url;
      })
      .catch((err) => {
        this.watchedState.error = err.errors[0];
        this.watchedState.valid = false;
        throw err;
      });
  }

  fetchRssFeed(url) {
    this.watchedState.process = 'sending';
    
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
          
          this.watchedState.process = 'finished';
          resolve(feedData);
        })
        .catch(error => {
          this.watchedState.process = 'error';
          this.watchedState.error = 'Не удалось загрузить RSS поток. Проверьте ссылку.';
          reject(new Error('Не удалось загрузить RSS поток. Проверьте ссылку.'));
        });
    });
  }

  addFeed(feedData) {
    this.feeds.push(feedData);
    this.renderFeeds();
    this.urlInput.value = '';
    this.watchedState.process = 'filling';
    this.watchedState.error = null;
    this.watchedState.valid = true;
    this.urlInput.focus();
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

  render() {
    if (this.watchedState.error) {
      this.urlInput.classList.add('is-invalid');
      this.feedback.textContent = this.watchedState.error;
      this.feedback.classList.add('invalid-feedback');
      this.feedback.classList.remove('text-success', 'text-info');
    }
     else {
      this.urlInput.classList.remove('is-invalid');
      this.feedback.textContent = '';
      this.feedback.classList.remove('invalid-feedback');
    }

    if (this.watchedState.process === 'sending') {
      this.submitButton.disabled = true;
      this.feedback.textContent = 'Загрузка...';
      this.feedback.classList.add('text-info');
      this.feedback.classList.remove('invalid-feedback', 'text-success');
    }
     else if (this.watchedState.process === 'finished') {
      this.submitButton.disabled = false;
    }
     else if (this.watchedState.process === 'error') {
      this.submitButton.disabled = false;
    }
     else {
      this.submitButton.disabled = false;
    }
  }

  handleSubmit() {
    const url = this.urlInput.value.trim();

    this.validateUrl(url)
      .then(validatedUrl => this.fetchRssFeed(validatedUrl))
      .then(feedData => this.addFeed(feedData))
      .catch(error => {
        console.error(error);
      });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RssReader();
});