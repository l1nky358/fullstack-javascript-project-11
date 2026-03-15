import * as yup from 'yup'
import i18next from './locales.js'

yup.setLocale({
  mixed: {
    required: () => i18next.t('errors.required'),
    notOneOf: () => i18next.t('errors.alreadyExists'),
  },
  string: {
    url: () => i18next.t('errors.invalidUrl'),
  },
})

const validate = (url, existingUrls) => {
  const schema = yup.string()
    .required()
    .url()
    .notOneOf(existingUrls)

  return schema.validate(url)
    .then(() => null)
    .catch((err) => {
      return Promise.reject(new Error(err.message))
    })
}

export default validate
