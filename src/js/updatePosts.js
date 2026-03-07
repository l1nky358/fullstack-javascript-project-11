import fetchRss from './httpClient.js'
import parseRss from './rssParser.js'

let idCounter = 0
const generateId = () => {
  idCounter += 1
  return idCounter
}

const updatePosts = (watchedState) => {
  const checkFeed = feed => {
    return fetchRss(feed.url)
      .then(xmlString => parseRss(xmlString, feed.url))
      .then(data => {
        const existingPosts = watchedState.posts.filter(p => p.feedId === feed.id)
        const existingLinks = existingPosts.map(p => p.link)

        const newPosts = data.posts
          .filter(post => !existingLinks.includes(post.link))
          .map(post => ({
            ...post,
            id: generateId(),
            feedId: feed.id,
          }))

        if (newPosts.length > 0) {
          watchedState.posts = [...watchedState.posts, ...newPosts]
        }
      })
      .catch(err => {
        console.error('Ошибка обновления фида', feed.url, err)
      })
  }

  const promises = watchedState.feeds.map(checkFeed)

  return Promise.all(promises)
    .finally(() => {
      setTimeout(() => updatePosts(watchedState), 5000)
    })
}

export default updatePosts
