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
    const container = elements.feedsContainer
    if (!container) return
    
    container.innerHTML = ''
    
    feeds.forEach((feed) => {
      const feedEl = document.createElement('div')
      feedEl.classList.add('card', 'mb-3')
      
      const cardBody = document.createElement('div')
      cardBody.classList.add('card-body')
      
      const title = document.createElement('h3')
      title.classList.add('card-title', 'h5')
      title.textContent = feed.title
      
      const description = document.createElement('p')
      description.classList.add('card-text', 'small', 'text-muted')
      description.textContent = feed.description
      
      cardBody.appendChild(title)
      cardBody.appendChild(description)
      feedEl.appendChild(cardBody)
      container.appendChild(feedEl)
    })
  }

  const renderPosts = (posts) => {
    const container = elements.postsContainer
    if (!container) return
    
    container.innerHTML = ''
    
    posts.forEach((post) => {
      const postEl = document.createElement('div')
      postEl.classList.add('card', 'mb-2')
      
      const cardBody = document.createElement('div')
      cardBody.classList.add('card-body', 'p-2')
      
      const link = document.createElement('a')
      link.href = post.link
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.textContent = post.title
      link.classList.add(state.uiState.viewedPosts.has(post.id) ? 'text-secondary' : 'fw-bold')
      
      const button = document.createElement('button')
      button.type = 'button'
      button.classList.add('btn', 'btn-primary', 'btn-sm', 'ms-2')
      button.dataset.id = post.id
      button.dataset.bsToggle = 'modal'
      button.dataset.bsTarget = '#modal'
      button.textContent = i18next.t('buttons.preview')
      
      cardBody.appendChild(link)
      cardBody.appendChild(button)
      postEl.appendChild(cardBody)
      container.appendChild(postEl)
    })
  }

  const renderForm = () => {
    const formState = state.form
    
    if (formState.process.status === 'sending') {
      elements.submitButton.disabled = true
      elements.input.disabled = true
    } else {
      elements.submitButton.disabled = false
      elements.input.disabled = false
    }
    
    if (formState.validation.isValid === false) {
      elements.input.classList.add('is-invalid')
      elements.feedback.classList.add('text-danger')
      elements.feedback.classList.remove('text-success')
      elements.feedback.textContent = formState.validation.error
    }
    else if (formState.process.status === 'finished') {
      elements.input.classList.remove('is-invalid')
      elements.feedback.classList.add('text-success')
      elements.feedback.classList.remove('text-danger')
      elements.feedback.textContent = i18next.t('success')
      setTimeout(() => {
        state.form.process.status = 'idle'
        elements.feedback.textContent = ''
      }, 2000)
    }
    else {
      elements.input.classList.remove('is-invalid')
      elements.feedback.classList.remove('text-danger', 'text-success')
      elements.feedback.textContent = ''
    }
  }

  elements.postsContainer.addEventListener('click', (e) => {
    const button = e.target.closest('[data-bs-target="#modal"]')
    if (!button) return
    
    const postId = button.dataset.id
    const post = state.posts.find(p => p.id === postId)
    
    if (!post) return
    
    if (!state.uiState.viewedPosts.has(postId)) {
      state.uiState.viewedPosts.add(postId)
      renderPosts(state.posts)
    }
    
    elements.modalTitle.textContent = post.title
    elements.modalBody.textContent = post.description
    elements.modalLink.href = post.link
  })

  subscribe(state, () => {
    renderFeeds(state.feeds)
    renderPosts(state.posts)
    renderForm()
  })

  renderForm()
  return state
}

export default initView
