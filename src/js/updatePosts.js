import fetchRss from './httpClient.js'
import parseRss from './rssParser.js'

const updatePosts = (state) => {
  const checkFeed = (feed) => fetchRss(feed.url)
    .then((xmlString) => parseRss(xmlString))
    .then((data) => {
      const existingPosts = state.posts.filter((p) => p.feedId === feed.id)
      const existingLinks = existingPosts.map((p) => p.link)
      const newPosts = data.posts
        .filter((post) => !existingLinks.includes(post.link))
        .map((post) => ({
          ...post,
          id: Date.now() + Math.random(),
          feedId: feed.id,
        }))
      if (newPosts.length > 0) {
        state.posts = [...state.posts, ...newPosts]
      }
    })
    .catch((err) => {
      console.error('Update error:', err)
    })

  return Promise.all(state.feeds.map(checkFeed))
    .finally(() => {
      setTimeout(() => updatePosts(state), 5000)
    })
}

export default updatePosts
