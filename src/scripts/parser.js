const parseRSS = (data, url) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(data, 'text/xml');
  
  const parseError = xml.querySelector('parsererror');
  if (parseError) {
    console.error('Parse error:', parseError.textContent);
    throw new Error('noRss');
  }

  const feedTitle = xml.querySelector('channel > title')?.textContent?.trim() || 'Без названия';
  const feedDescription = xml.querySelector('channel > description')?.textContent?.trim() || '';

  const items = xml.querySelectorAll('item');
  const posts = Array.from(items).map((item) => ({
    title: item.querySelector('title')?.textContent?.trim() || 'Без названия',
    link: item.querySelector('link')?.textContent?.trim() || '#',
    description: item.querySelector('description')?.textContent?.trim() || '',
  }));

  console.log('Parsed feed:', { feedTitle, feedDescription, postsCount: posts.length });

  return {
    feed: {
      url,
      title: feedTitle,
      description: feedDescription,
    },
    posts,
  };
};

export default parseRSS;
