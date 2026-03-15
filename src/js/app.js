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
    modalPostId: null,
  },
})

const generateFeedId = (url) => {
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `feed_${Math.abs(hash)}`
}

const generatePostId = (feedId, postTitle) => {
  const cleanTitle = postTitle.replace(/[^a-zA-Z0-9]/g, '_')
  return `${feedId}_${cleanTitle}`
}

const addFeed = (url, watchedState) => fetchRss(url)
  .then(xmlString => parseRss(xmlString))
  .then((data) => {
    const feedId = generateFeedId(url)
    const newFeed = {
      ...data.feed,
      id: feedId,
      url,
      title: data.feed.title || 'Без названия',
      description: data.feed.description || 'Без описания',
    }
    watchedState.feeds.push(newFeed)
    const newPosts = data.posts.map(post => ({
      ...post,
      id: generatePostId(feedId, post.title),
      feedId,
      title: post.title || 'Без названия',
      description: post.description || 'Без описания',
      link: post.link || '#',
    }))
    watchedState.posts = [...watchedState.posts, ...newPosts]
    updatePosts(watchedState)
    return data
  })
  .catch((err) => {
    if (err.message === 'errors.invalidRss') {
      throw new Error(i18next.t('errors.invalidRss'))
    }
    if (err.message === 'errors.network') {
      throw new Error(i18next.t('errors.network'))
    }
    throw err
  })

const app = () => {
  const watchedState = initView(state)
  const form = document.querySelector('.rss-form')
  if (!form) {
    console.error('Form not found!')
    return
  }
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
        watchedState.form.validation.isValid = true
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
