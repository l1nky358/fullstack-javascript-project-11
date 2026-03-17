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
    
    const ul = document.createElement('ul')
    ul.classList.add('list-group')
    
    feeds.forEach((feed) => {
      const li = document.createElement('li')
      li.classList.add('list-group-item')
      
      const title = document.createElement('h3')
      title.textContent = feed.title
      
      const desc = document.createElement('p')
      desc.textContent = feed.description
      
      li.appendChild(title)
      li.appendChild(desc)
      ul.appendChild(li)
    })
    
    container.appendChild(ul)
  }

  const renderPosts = (posts) => {
    const container = elements.postsContainer
    if (!container) return
    
    container.innerHTML = ''
    
    const ul = document.createElement('ul')
    ul.classList.add('list-group')
    
    posts.forEach((post) => {
      const li = document.createElement('li')
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start')
      
      const link = document.createElement('a')
      link.href = post.link
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.textContent = post.title
      link.classList.add(state.uiState.viewedPosts.has(post.id) ? 'link-secondary' : 'fw-bold')
      
      const button = document.createElement('button')
      button.type = 'button'
      button.classList.add('btn', 'btn-primary', 'btn-sm')
      button.dataset.id = post.id
      button.dataset.bsToggle = 'modal'
      button.dataset.bsTarget = '#modal'
      button.textContent = i18next.t('buttons.preview')
      
      li.appendChild(link)
      li.appendChild(button)
      ul.appendChild(li)
    })
    
    container.appendChild(ul)
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
    const button = e.target.closest('.btn-primary')
    if (!button || !button.dataset.id) return
    
    const postId = button.dataset.id
    const post = state.posts.find(p => p.id === postId)
    
    if (!post) return
    
    if (!state.uiState.viewedPosts.has(postId)) {
      state.uiState.viewedPosts.add(postId)
      const link = button.closest('li')?.querySelector('a')
      if (link) {
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

  return state
}

export default initView
