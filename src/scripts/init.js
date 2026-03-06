import i18next from 'i18next';
import resources from './locales/ru.js';

const initI18n = () => {
  const i18nInstance = i18next.createInstance();
  return i18nInstance.init({
    lng: 'ru',
    debug: false,
    resources,
  });
};

export default initI18n;
