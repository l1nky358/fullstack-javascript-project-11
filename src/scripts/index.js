  fetchRssFeed(url) {
    this.watchedState.form.process = 'sending';
    
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&disableCache=true`;

    return axios.get(proxyUrl, { timeout: 10000 })
      .then(response => {
        if (response.data?.contents) {
          return response.data.contents;
        }
        throw new Error('network');
      })
      .then(data => {
        try {
          const parsed = parseRSS(data, url);
          return parsed;
        }
        catch (error) {
          throw new Error('parseError');
        }
      })
      .then(({ feed, posts }) => {
        const feedId = _uniqueId('feed_');
        const feedWithId = { ...feed, id: feedId };
        
        const postsWithIds = posts.map(post => ({
          ...post,
          id: _uniqueId('post_'),
          feedId,
        }));

        this.watchedState.form.process = 'success';
        this.watchedState.form.error = null;
        
        return { feed: feedWithId, posts: postsWithIds };
      })
      .catch((error) => {
        this.watchedState.form.process = 'error';
        if (error.code === 'ECONNABORTED') {
          this.watchedState.form.error = 'Ошибка сети';
        }
        else if (error.message === 'parseError') {
          this.watchedState.form.error = 'Ресурс не содержит валидный RSS';
        }
        else {
          this.watchedState.form.error = 'Ошибка сети';
        }
        throw error;
      });
  }
