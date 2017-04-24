let Vue

let install = (_Vue, conf = {}) => {
  if (Vue) {
    console.error(
      '[spine] already installed. Vue.use(Spine) should be called only once.'
    )
    return
  }
  Vue = _Vue

  const usesInit = Vue.config._lifecycleHooks.indexOf('init') > -1
  Vue.mixin(usesInit ? { init: spineInit } : { beforeCreate: spineInit })

  function spineInit () {
    const options = this.$options

    if (!this.$) {
      if (options.parent && options.parent.$) {
        this.$ = options.parent.$
      } else {
        this.$ = {}
      }
    }

    // spine injection
    if (options.spine) {
      Object.keys(options.spine).forEach(namespace => {
        let classDefinition = options.spine[namespace]

        classDefinition.registerStore(this, namespace, conf)
      })
    }
  }
}

export default install
