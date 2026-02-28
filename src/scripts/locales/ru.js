export default {
  translation: {
    app: {
      title: 'RSS агрегатор',
      description: 'Начните читать RSS сегодня! Это легко, красиво и удобно.',
    },
    form: {
      label: 'Ссылка RSS',
      button: 'Добавить',
      feedback: {
        loading: 'Загрузка...',
        success: 'RSS успешно добавлен!',
        error: 'Не удалось загрузить RSS поток. Проверьте ссылку.',
        parseError: 'Ресурс не содержит валидный RSS',
      },
    },
    feeds: {
      title: 'Фиды',
      empty: 'Пока нет добавленных RSS потоков',
    },
    posts: {
      title: 'Посты',
      empty: 'Нет постов',
      button: 'Просмотр',
    },
    errors: {
      required: 'Не должно быть пустым',
      invalidUrl: 'Ссылка должна быть валидным URL',
      duplicate: 'RSS поток уже добавлен',
      network: 'Ошибка сети',
    },
  },
};