const fetch = require('node-fetch')

function addUrlQueryParams (endpoint, params) {
  let url = new URL(endpoint)
  if (params) {
    // append URL query paramenters
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key])
    })
  }
  return url
}

module.exports = async function (url, options = {}) {
  if (!url) {
    throw Error('url is a required parameter for fetch')
  }
  
  if (options.body) {
    // set content type to JSON by default
    options.headers = options.headers || {}
    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json'
    // stringify JSON body if it's not a string already
    if (typeof options.body !== 'string') {
      options.body = JSON.stringify(options.body)
    }
  }
  
  try {
    // add query parameters to URL
    let completeUrl = url
    if (options.query) {
      completeUrl = addUrlQueryParams(url, options.query)
    }
    const response = await fetch(completeUrl, options)
    const text = await response.text()
    if (response.ok) {
      const json = JSON.parse(text)
      return json
    } else {
      let message = text
      try {
        const json = JSON.parse(text)
        // message = json.message
        message = json.error_description || json.error
      } catch (e) {
        // continue
      }
      const error = Error(`${response.status} ${response.statusText} - ${message}`)
      error.status = response.status
      error.statusText = response.statusText
      error.text = message
      error.response = response
      throw error
    }
  } catch (e) {
    // just rethrow any other errors, like connection timeouts
    throw e
  }
}
