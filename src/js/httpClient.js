import axios from 'axios'

const fetchRss = (url) => {
  const proxyUrl = 'https://allorigins.hexlet.app/get'
  const requestUrl = new URL(proxyUrl)
  requestUrl.searchParams.set('disableCache', 'true')
  requestUrl.searchParams.set('url', url)

  return axios.get(requestUrl.toString())
    .then((response) => {
      if (response.data && response.data.contents) {
        return response.data.contents
      }
      throw new Error('errors.invalidRss')
    })
    .catch((error) => {
      if (error.message === 'errors.invalidRss') {
        throw error
      }
      throw new Error('errors.network')
    })
}

export default fetchRss
