import { proxy } from 'valtio'
import i18next from './locales.js'
import initView from './initView.js'
import fetchRss from './httpClient.js'
import parseRss from './rssParser.js'
import validate from './validate.js'

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

let idCounter = 0
const generateId = () => {
  idCounter += 1
  return idCounter
}

const addFeed = (url, watchedState) => fetchRss(url)
  .then(xmlString => parseRss(xmlString))
  .then((data) => {
    const feedId = generateId()
    const newFeed = {
      id: feedId,
      url,
      title: data.feed.title,
      description: data.feed.description,
    }
    watchedState.feeds.push(newFeed)
    
    const newPosts = data.posts.map(post => ({
      id: generateId(),
      feedId,
      title: post.title,
      description: post.description,
      link: post.link,
    }))
    
    watchedState.posts.push(...newPosts)
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
  
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const url = formData.get('url')
    
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
