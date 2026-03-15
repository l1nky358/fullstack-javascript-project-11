import fetchRss from './httpClient.js'
import parseRss from './rssParser.js'
import i18next from './locales.js'

const updatePosts = (state) => {
  const checkFeed = (feed) => fetchRss(feed.url)
    .then(xmlString => parseRss(xmlString))
    .then((data) => {
      const existingPosts = state.posts.filter(p => p.feedId === feed.id)
      const existingLinks = new Set(existingPosts.map(p => p.link))
      
      const newPosts = data.posts
        .filter(post => !existingLinks.has(post.link))
        .map(post => ({
          ...post,
          id: `${feed.id}_${post.title.replace(/[^a-zA-Z0-9]/g, '_')}`,
          feedId: feed.id,
          title: post.title || 'Без названия',
          description: post.description || 'Без описания',
          link: post.link || '#',
        }))
      
      if (newPosts.length > 0) {
        state.posts = [...state.posts, ...newPosts]
        
        const notification = document.createElement('div')
        notification.classList.add('alert', 'alert-info', 'alert-dismissible', 'fade', 'show', 'position-fixed', 'top-0', 'end-0', 'm-3')
        notification.setAttribute('role', 'alert')
        notification.innerHTML = `
          ${i18next.t('newPosts', { count: newPosts.length })}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `
        document.body.appendChild(notification)
        
        setTimeout(() => {
          notification.remove()
        }, 5000)
      }
    })
    .catch((err) => {
      console.error('Update error for feed:', feed.url, err)
    })

  return Promise.all(state.feeds.map(checkFeed))
    .finally(() => {
      setTimeout(() => updatePosts(state), 5000)
    })
}

export default updatePosts
