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
      feedEl.classList.add('feed')
      
      const title = document.createElement('h3')
      title.classList.add('feed-title')
      title.textContent = feed.title
      
      const desc = document.createElement('p')
      desc.classList.add('feed-description')
      desc.textContent = feed.description
      
      feedEl.appendChild(title)
      feedEl.appendChild(desc)
      container.appendChild(feedEl)
    })
  }

  const renderPosts = (posts) => {
    const container = elements.postsContainer
    if (!container) return
    
    container.innerHTML = ''
    
    posts.forEach((post) => {
      const postEl = document.createElement('div')
      postEl.classList.add('post')
      
      const link = document.createElement('a')
      link.href = post.link
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.textContent = post.title
      link.classList.add('post-link')
      
      if (state.uiState.viewedPosts.has(post.id)) {
        link.classList.add('link-secondary')
      }
      else {
        link.classList.add('fw-bold')
      }
      
      const button = document.createElement('button')
      button.type = 'button'
      button.classList.add('btn', 'btn-primary', 'btn-sm', 'preview-button')
      button.dataset.id = post.id
      button.dataset.bsToggle = 'modal'
      button.dataset.bsTarget = '#modal'
      button.textContent = i18next.t('buttons.preview')
      
      postEl.appendChild(link)
      postEl.appendChild(button)
      container.appendChild(postEl)
    })
  }

  const renderForm = () => {
    const formState = state.form
    
    if (formState.process.status === 'sending') {
      elements.submitButton.disabled = true
      elements.input.disabled = true
    }
    else {
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
      elements.input.value = ''
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
    const button = e.target.closest('.preview-button')
    if (!button) return
    
    const postId = button.dataset.id
    const post = state.posts.find(p => p.id === postId)
    if (!post) return
    
    if (!state.uiState.viewedPosts.has(postId)) {
      state.uiState.viewedPosts.add(postId)
      const link = button.previousElementSibling
      if (link && link.classList) {
        link.classList.remove('fw-bold')
        link.classList.add('link-secondary')
      }
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
