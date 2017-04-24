var classify = (str) => {
  const camelCase = str.replace(/[-_\s]+(.)?/g, function (match, c) {
    return c ? c.toUpperCase() : ''
  })

  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1)
}

export default {
  classify
}

export {
  classify
}
