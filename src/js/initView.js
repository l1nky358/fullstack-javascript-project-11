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
      
      const title = document.createElement('h2')
      title.textContent = feed.title
      
      const desc = document.createElement('p')
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
      const link = document.createElement('a')
      link.href = post.link
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.textContent = post.title
      link.dataset.id = post.id
      link.classList.add('post-link')
      
      if (state.uiState.viewedPosts.has(post.id)) {
        link.classList.add('link-secondary', 'fw-normal')
        link.classList.remove('fw-bold')
      } 
      else {
        link.classList.add('fw-bold')
        link.classList.remove('link-secondary', 'fw-normal')
      }
      
      container.appendChild(link)
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
    
    elements.input.classList.remove('is-invalid')
    elements.feedback.classList.remove('text-danger', 'text-success')
    
    if (formState.validation.isValid === false) {
      elements.input.classList.add('is-invalid')
      elements.feedback.classList.add('text-danger')
      elements.feedback.textContent = formState.validation.error
    } 
    else if (formState.process.status === 'finished') {
      elements.feedback.classList.add('text-success')
      elements.feedback.textContent = i18next.t('success')
      elements.input.value = ''
      setTimeout(() => {
        state.form.process.status = 'idle'
        if (elements.feedback.textContent === i18next.t('success')) {
          elements.feedback.textContent = ''
        }
      }, 2000)
    }
  }

  elements.postsContainer.addEventListener('click', (e) => {
    const link = e.target.closest('a')
    if (!link || !link.dataset.id) return
    
    const postId = link.dataset.id
    const post = state.posts.find(p => p.id === postId)
    
    if (!post) return
    
    if (!state.uiState.viewedPosts.has(postId)) {
      state.uiState.viewedPosts.add(postId)
      link.classList.remove('fw-bold')
      link.classList.add('link-secondary', 'fw-normal')
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

  return state
}

export default initView
