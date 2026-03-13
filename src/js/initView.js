import { subscribe } from 'valtio'
import i18next from './locales.js'
import * as bootstrap from 'bootstrap'

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
    feeds.forEach((feed) => {
      const li = document.createElement('li')
      li.classList.add('list-group-item')
      
      const titleEl = document.createElement('h3')
      titleEl.textContent = feed.title
      li.appendChild(titleEl)
      
      const descEl = document.createElement('p')
      descEl.textContent = feed.description
      li.appendChild(descEl)
      
      feedsContainer.appendChild(li)
    })
  }

  const renderPosts = (posts) => {
    const postsContainer = elements.postsContainer
    postsContainer.innerHTML = ''
    posts.forEach((post) => {
      const li = document.createElement('li')
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start')
      
      const linkEl = document.createElement('a')
      linkEl.href = post.link
      linkEl.target = '_blank'
      linkEl.rel = 'noopener noreferrer'
      linkEl.textContent = post.title
      
      const isViewed = state.uiState.viewedPosts.includes(post.id)
      linkEl.classList.add(isViewed ? 'link-secondary' : 'fw-bold')
      
      const buttonEl = document.createElement('button')
      buttonEl.type = 'button'
      buttonEl.classList.add('btn', 'btn-primary', 'btn-sm', 'preview-button')
      buttonEl.dataset.id = post.id
      buttonEl.textContent = i18next.t('buttons.preview')
      
      li.appendChild(linkEl)
      li.appendChild(buttonEl)
      postsContainer.appendChild(li)
    })
  }

  const renderForm = () => {
    const formState = state.form
    
    switch (formState.status) {
      case 'idle':
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
        elements.feedback.classList.remove('text-danger', 'text-success')
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

  elements.postsContainer.addEventListener('click', (e) => {
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
        
        elements.modal.addEventListener('hidden.bs.modal', () => {
          modal.dispose()
        }, { once: true })
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
