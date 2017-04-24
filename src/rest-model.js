import Model from './model'
import { underscore } from './utils'

class RestModel extends Model {

  constructor () {
    super(...arguments)

    this.urlBase = this.constructor.urlBase
    this.httpActions = this.constructor.httpActions
  }

  static get urlBase () {
    return `/${this.resourceName()}`
  }

  static resourceName () {
    if (this.resourceNameCache) return this.resourceNameCache
    this.resourceNameCache = `${underscore(this.name)}s`
    return this.resourceNameCache
  }

  static async find (id) {
    var instance = super.find(id)
    if (instance) return instance

    const response = await this.vm.$http.get(`${this.urlBase}/${id}`)
    return this.load(response.data)
  }

  // TODO: pagination
  static async fetch () {
    const response = await this.vm.$http.get(this.urlBase)

    response.data.forEach((entry) => {
      this.load(entry)
    })

    return this.all()
  }

  async preserve () {
    var attributes = this.attributes()
    delete attributes.id

    if (this.isNew()) {
      const response = await this.vm.$http.post(this.urlBase, attributes)
      this.changeID(response.data.id)
    } else {
      await this.vm.$http.put(`${this.urlBase}/${this.id}`, attributes)
    }
  }

  async destroy () {
    await this.vm.$http.delete(`${this.urlBase}/${this.id}`)
    this.delete()
  }
}

export default RestModel
