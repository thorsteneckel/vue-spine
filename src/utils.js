var classify = (str) => {
  const camelCase = str.replace(/[-_\s]+(.)?/g, function (match, c) {
    return c ? c.toUpperCase() : ''
  })

  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1)
}

var underscore = (str) => {
  return str.replace(/\.?([A-Z]+)/g, (x, y) => {
    return '_' + y.toLowerCase()
  }).replace(/^_/, '')
}

export default {
  classify,
  underscore
}

export {
  classify,
  underscore
}
