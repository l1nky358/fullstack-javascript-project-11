const parseRss = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    const error = new Error('noRss');
    error.isParseError = true;
    throw error;
  }

  const feedTitle = doc.querySelector('channel > title')?.textContent.trim() || '';
  const feedDescription = doc.querySelector('channel > description')?.textContent.trim() || '';

  const items = doc.querySelectorAll('item');
  const posts = Array.from(items).map((item) => ({
    title: item.querySelector('title')?.textContent.trim() || '',
    link: item.querySelector('link')?.textContent.trim() || '',
    description: item.querySelector('description')?.textContent.trim() || '',
  }));

  return {
    feed: {
      title: feedTitle,
      description: feedDescription,
    },
    posts,
  };
};

export default parseRss;
