import axios from 'axios';

const proxyUrl = 'https://allorigins.hexlet.app/get';

const fetchRss = (url) => {
  const requestUrl = new URL(proxyUrl);
  requestUrl.searchParams.set('disableCache', 'true');
  requestUrl.searchParams.set('url', url);

  return axios.get(requestUrl.toString())
    .then((response) => {
      if (response.data?.contents) {
        return response.data.contents;
      }
      throw new Error('Invalid response from proxy');
    });
};

export default fetchRss;