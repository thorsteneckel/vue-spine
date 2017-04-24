import Model from './model'

class LegacyModel extends Model {

  // TODO: inform the user that the legacy model is used to create some presure? :)
  // Might be good to not show in production env

  //
  // TODO: check if following functions are needed or only compatiblity
  //

  static findByAttribute () {
    return this.findBy(...arguments)
  }

  static findAllByAttribute () {
    return this.findAllBy(...arguments)
  }

  updateAttribute (name, value) {
    const attributes = {}
    attributes[name] = value
    this.updateAttributes(attributes)
  }

  updateAttributes (attributes) {
    Object.keys(attributes).forEach(name => {
      this[name] = attributes[name]
    })
    this.save()
  }

  attributes () {
    var result = {}
    this.properties.forEach(property => {
      result[property.name] = this[property.name]
    })
    return result
  }

  exists () {
    return this.constructor.exists(this.id)
  }

  // alias to support Spine API
  remove () {
    this.delete()
  }
}

export default LegacyModel
