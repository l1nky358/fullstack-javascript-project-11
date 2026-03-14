import * as yup from 'yup'
import i18next from './locales.js'

yup.setLocale({
  mixed: {
    required: () => ({ key: 'errors.required' }),
    notOneOf: () => ({ key: 'errors.alreadyExists' }),
  },
  string: {
    url: () => ({ key: 'errors.invalidUrl' }),
  },
})

const validate = (url, existingUrls) => {
  const schema = yup.string().required().url().notOneOf(existingUrls)
  return schema.validate(url)
    .then(() => null)
    .catch((err) => {
      const messageKey = err.errors?.[0]?.key || 'errors.invalidUrl'
      return Promise.reject(new Error(i18next.t(messageKey)))
    })
}

export default validate
