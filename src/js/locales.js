import i18next from 'i18next';

i18next.init({
  lng: 'ru',
  resources: {
    ru: {
      translation: {
        errors: {
          required: 'Не должно быть пустым',
          invalidUrl: 'Ссылка должна быть валидным URL',
          alreadyExists: 'RSS уже существует',
          invalidRss: 'Ресурс не содержит валидный RSS',
          network: 'Ошибка сети',
        },
        success: 'RSS успешно загружен',
        buttons: {
          add: 'Добавить',
          preview: 'Просмотр',
          close: 'Закрыть',
          readFull: 'Читать полностью',
        },
        titles: {
          feeds: 'Фиды',
          posts: 'Посты',
        },
      },
    },
  },
});

export default i18next;