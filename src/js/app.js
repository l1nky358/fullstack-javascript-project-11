import { proxy } from 'valtio'
import i18next from './locales.js'
import initView from './initView.js'
import fetchRss from './httpClient.js'
import parseRss from './rssParser.js'
import validate from './validate.js'
import updatePosts from './updatePosts.js'

const state = proxy({
  form: {
    validation: {
      isValid: null,
      error: null,
    },
    process: {
      status: 'idle',
    },
  },
  feeds: [],
  posts: [],
  uiState: {
    viewedPosts: new Set(),
  },
})

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2)

const addFeed = (url, watchedState) => fetchRss(url)
  .then(xmlString => parseRss(xmlString))
  .then((data) => {
    const feedId = generateId()
    const newFeed = {
      id: feedId,
      url,
      title: data.feed.title || 'Без названия',
      description: data.feed.description || 'Без описания',
    }
    watchedState.feeds = [...watchedState.feeds, newFeed]

    const newPosts = data.posts.map(post => ({
      id: generateId(),
      feedId,
      title: post.title || 'Без названия',
      description: post.description || 'Без описания',
      link: post.link || '#',
    }))
    
    watchedState.posts = [...watchedState.posts, ...newPosts]
    
    return data
  })
  .catch((err) => {
    if (err.message === 'errors.invalidRss') {
      throw new Error(i18next.t('errors.invalidRss'))
    }
    throw new Error(i18next.t('errors.network'))
  })

const app = () => {
  const watchedState = initView(state)
  const form = document.querySelector('.rss-form')
  
  if (!form) return
  
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const url = formData.get('url')?.trim()
    
    if (!url) {
      watchedState.form.validation.isValid = false
      watchedState.form.validation.error = i18next.t('errors.required')
      return
    }
    
    const existingUrls = watchedState.feeds.map(feed => feed.url)
    watchedState.form.process.status = 'sending'
    watchedState.form.validation.isValid = true
    watchedState.form.validation.error = null
    
    validate(url, existingUrls)
      .then(() => addFeed(url, watchedState))
      .then(() => {
        watchedState.form.process.status = 'finished'
        document.querySelector('#url-input').value = ''
      })
      .catch((err) => {
        watchedState.form.validation.isValid = false
        watchedState.form.validation.error = err.message
        watchedState.form.process.status = 'failed'
      })
  })
}

app()
export default app
