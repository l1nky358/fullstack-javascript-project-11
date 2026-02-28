const parseRSS = (data, url) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(data, 'text/xml');
  
  const parseError = xml.querySelector('parsererror');
  if (parseError) {
    throw new Error('parseError');
  }

  const feedTitle = xml.querySelector('channel > title')?.textContent?.trim() || 'Без названия';
  const feedDescription = xml.querySelector('channel > description')?.textContent?.trim() || '';

  const items = xml.querySelectorAll('item');
  const posts = Array.from(items).map((item) => ({
    title: item.querySelector('title')?.textContent?.trim() || 'Без названия',
    link: item.querySelector('link')?.textContent?.trim() || '#',
    description: item.querySelector('description')?.textContent?.trim() || '',
    pubDate: item.querySelector('pubDate')?.textContent || '',
  }));

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