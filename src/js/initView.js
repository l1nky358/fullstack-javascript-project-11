import { subscribe } from 'valtio'
import i18next from './locales.js'

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
  }

  const renderFeeds = (feeds) => {
    const feedsContainer = elements.feedsContainer
    feedsContainer.innerHTML = ''
    feeds.forEach(feed => {
      const li = document.createElement('li')
      li.classList.add('list-group-item')
      li.innerHTML = `
        <h3>${feed.title}</h3>
        <p>${feed.description}</p>
      `
      feedsContainer.appendChild(li)
    })
  }

  const renderPosts = (posts) => {
    const postsContainer = elements.postsContainer
    postsContainer.innerHTML = ''
    posts.forEach(post => {
      const li = document.createElement('li')
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start')
      const isViewed = state.uiState.viewedPosts.includes(post.id)
      const linkClass = isViewed ? 'link-secondary' : 'fw-bold'
      li.innerHTML = `
        <a href="${post.link}" class="${linkClass}" target="_blank" rel="noopener noreferrer">${post.title}</a>
        <button type="button" class="btn btn-primary btn-sm preview-button" data-id="${post.id}">${i18next.t('buttons.preview')}</button>
      `
      postsContainer.appendChild(li)
    })
  }

  const renderForm = () => {
    const formState = state.form
    switch (formState.status) {
      case 'filling':
        elements.submitButton.disabled = false
        elements.input.disabled = false
        break
      case 'sending':
        elements.submitButton.disabled = true
        elements.input.disabled = true
        break
      case 'finished':
        elements.submitButton.disabled = false
        elements.input.disabled = false
        elements.input.value = ''
        elements.feedback.classList.remove('text-danger')
        elements.feedback.classList.add('text-success')
        elements.feedback.textContent = i18next.t('success')
        elements.input.focus()
        break
      case 'failed':
        elements.submitButton.disabled = false
        elements.input.disabled = false
        break
      default:
        break
    }
    if (formState.valid === false) {
      elements.input.classList.add('is-invalid')
      elements.feedback.classList.remove('text-success')
      elements.feedback.classList.add('text-danger')
      elements.feedback.textContent = formState.error || ''
    } else {
      elements.input.classList.remove('is-invalid')
    }
  }

  elements.postsContainer.addEventListener('click', e => {
    const button = e.target.closest('.preview-button')
    if (button) {
      const postId = Number(button.dataset.id)
      if (!state.uiState.viewedPosts.includes(postId)) {
        state.uiState.viewedPosts.push(postId)
      }
      const post = state.posts.find(p => p.id === postId)
      if (post) {
        elements.modalTitle.textContent = post.title
        elements.modalBody.textContent = post.description
        elements.modalLink.href = post.link
        const modal = new bootstrap.Modal(elements.modal)
        modal.show()
      }
    }
  })

  subscribe(state, () => {
    renderFeeds(state.feeds)
    renderPosts(state.posts)
    renderForm()
  })

  return state
}

export default initView
