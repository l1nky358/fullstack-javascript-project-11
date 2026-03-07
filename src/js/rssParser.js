const parseRss = (xmlString, url) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    const error = new Error('errors.invalidRss');
    error.isParsingError = true;
    throw error;
  }

  const feedTitle = xmlDoc.querySelector('channel > title')?.textContent || 'Без названия';
  const feedDescription = xmlDoc.querySelector('channel > description')?.textContent || 'Без описания';

  const items = xmlDoc.querySelectorAll('item');
  const posts = Array.from(items).map((item) => ({
    title: item.querySelector('title')?.textContent || 'Без названия',
    description: item.querySelector('description')?.textContent || 'Без описания',
    link: item.querySelector('link')?.textContent || '#',
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
