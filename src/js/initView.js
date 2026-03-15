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

  Object.entries(elements).forEach(([name, element]) => {
    if (!element) {
      console.error(`Element ${name} not found!`)
    }
  })

  const renderFeeds = (feeds) => {
    const feedsContainer = elements.feedsContainer
    if (!feedsContainer) return
    
    feedsContainer.innerHTML = ''
    
    if (feeds.length === 0) {
      const message = document.createElement('p')
      message.textContent = i18next.t('noFeeds')
      message.classList.add('text-muted', 'text-center')
      feedsContainer.appendChild(message)
      return
    }
    
    const card = document.createElement('div')
    card.classList.add('card', 'border-0')
    
    const cardBody = document.createElement('div')
    cardBody.classList.add('card-body')
    
    const title = document.createElement('h2')
    title.classList.add('card-title', 'h4')
    title.textContent = i18next.t('feeds')
    cardBody.appendChild(title)
    card.appendChild(cardBody)
    
    const listGroup = document.createElement('ul')
    listGroup.classList.add('list-group', 'border-0', 'rounded-0')
    
    feeds.forEach((feed) => {
      const li = document.createElement('li')
      li.classList.add('list-group-item', 'border-0', 'border-end-0')
      
      const feedTitle = document.createElement('h3')
      feedTitle.classList.add('h6', 'm-0')
      feedTitle.textContent = feed.title
      
      const feedDesc = document.createElement('p')
      feedDesc.classList.add('m-0', 'small', 'text-black-50')
      feedDesc.textContent = feed.description
      
      li.appendChild(feedTitle)
      li.appendChild(feedDesc)
      listGroup.appendChild(li)
    })
    
    card.appendChild(listGroup)
    feedsContainer.appendChild(card)
  }

  const renderPosts = (posts) => {
    const postsContainer = elements.postsContainer
    if (!postsContainer) return
    
    postsContainer.innerHTML = ''
    
    if (posts.length === 0) {
      const message = document.createElement('p')
      message.textContent = i18next.t('noPosts')
      message.classList.add('text-muted', 'text-center')
      postsContainer.appendChild(message)
      return
    }
    
    const card = document.createElement('div')
    card.classList.add('card', 'border-0')
    
    const cardBody = document.createElement('div')
    cardBody.classList.add('card-body')
    
    const title = document.createElement('h2')
    title.classList.add('card-title', 'h4')
    title.textContent = i18next.t('posts')
    cardBody.appendChild(title)
    card.appendChild(cardBody)
    
    const listGroup = document.createElement('ul')
    listGroup.classList.add('list-group', 'border-0', 'rounded-0')
    
    posts.forEach((post) => {
      const li = document.createElement('li')
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0')
      
      const linkEl = document.createElement('a')
      linkEl.href = post.link
      linkEl.target = '_blank'
      linkEl.rel = 'noopener noreferrer'
      linkEl.textContent = post.title
      
      const isViewed = state.uiState.viewedPosts.has(post.id)
      linkEl.classList.add(isViewed ? 'link-secondary' : 'fw-bold')
      
      const buttonEl = document.createElement('button')
      buttonEl.type = 'button'
      buttonEl.classList.add('btn', 'btn-outline-primary', 'btn-sm')
      buttonEl.dataset.id = post.id
      buttonEl.dataset.bsToggle = 'modal'
      buttonEl.dataset.bsTarget = '#modal'
      buttonEl.textContent = i18next.t('buttons.preview')
      
      li.appendChild(linkEl)
      li.appendChild(buttonEl)
      listGroup.appendChild(li)
    })
    
    card.appendChild(listGroup)
    postsContainer.appendChild(card)
  }

  const renderForm = () => {
    const formState = state.form
    
    switch (formState.process.status) {
      case 'sending':
        elements.submitButton.disabled = true
        elements.input.disabled = true
        elements.submitButton.textContent = i18next.t('buttons.sending')
        break
      case 'finished':
        elements.submitButton.disabled = false
        elements.input.disabled = false
        elements.input.value = ''
        elements.submitButton.textContent = i18next.t('buttons.add')
        elements.input.focus()
        setTimeout(() => {
          state.form.process.status = 'idle'
        }, 2000)
        break
      case 'failed':
      case 'idle':
        elements.submitButton.disabled = false
        elements.input.disabled = false
        elements.submitButton.textContent = i18next.t('buttons.add')
        break
      default:
        break
    }
    
    if (formState.validation.isValid === false) {
      elements.input.classList.add('is-invalid')
      elements.feedback.classList.remove('text-success')
      elements.feedback.classList.add('text-danger')
      elements.feedback.textContent = formState.validation.error || ''
    }
    else if (formState.process.status === 'finished') {
      elements.input.classList.remove('is-invalid')
      elements.feedback.classList.remove('text-danger')
      elements.feedback.classList.add('text-success')
      elements.feedback.textContent = i18next.t('success')
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

  return state
}

export default initView
