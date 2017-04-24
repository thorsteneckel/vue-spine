import { classify } from './utils'
import storeModule from './store-module'

export default class Model {

  constructor (attrs = {}) {
    this.store = this.constructor.store
    this.vm = this.constructor.vm
    this.namespace = this.constructor.namespace
    this.conf = this.constructor.conf

    // TODO: check if attributes are valid

    this.properties = this.constructor.attributes.slice()

    this.properties.forEach(property => {
      if (attrs[property.name]) return
      // TODO: default values?
      attrs[property.name] = null
    })

    // add id to properties list
    this.properties.push({
      name: 'id'
    })

    if (!this.constructor.idCounter) {
      this.constructor.idCounter = 1
    }

    this.reactiveAttributes = {}
    if (!attrs.id) {
      attrs.id = this.constructor.uid('c-')
      this.reactiveAttributes.id = attrs.id

      this.mutation('addTemporary', attrs.id)

      // since the result of .load might be a promise we have
      // to handle non-Promises results as if they were such
      // source: http://stackoverflow.com/a/39191573
      Promise.resolve(this.constructor.load(attrs)).then(result => {
        this.reactiveAttributes = result
      })
    } else {
      this.reactiveAttributes = attrs
    }

    // console.log('HERE constructor', this.constructor.name)
    // console.trace()

    this.associations = {}
    this.properties.forEach(entry => {
      const property = this._propertyConfig(entry)

      this._initializeAssociation(property)

      var definition = {
        get () {
          if (this.deleted) return
          return this.reactiveAttributes[property.name]
        }
      }

      // TODO: might print an error when trying to set ID?
      if (property.name !== 'id') {
        Object.assign(definition, {
          set (value) {
            if (this.deleted) return

            // we _could_ use direct access like:
            // this.reactiveAttributes[property.name] = value
            // but use the VueX API to be strict mode compatible
            this.mutation('updateAttribute', {
              id:    this.id,
              name:  property.name,
              value: value
            })
          }
        })
      }

      Object.defineProperty(this, property.name, definition)
    })
  }

  static registerStore (vm, namespace, conf) {
    this.vm = vm
    this.store = this.vm.$store
    this.namespace = namespace
    this.conf = conf

    const existingRegistration = this.vm.$[namespace]

    if (existingRegistration) {
      if (existingRegistration.name !== this.name) {
        console.error(`[spine] differing model registration: ${this.name} as ${namespace}, but ${existingRegistration.name} is registered`)
      }
      return
    }

    this.vm.$[namespace] = this

    this.store.registerModule(namespace, storeModule)
  }

  static get attributes () {
    return [{name: 'name'}]
  }

  static uid (prefix = '') {
    var uid = prefix + this.idCounter++
    // put your recursion glasses on 8-)
    if (this.exists(uid)) uid = this.uid
    return uid
  }

  static find (id) {
    var reactiveObject = this.getter('find', id)
    if (!reactiveObject) return
    return new this(reactiveObject)
  }

  static findAll (ids) {
    return this.getter('findAll', ids)
  }

  static exists (id) {
    return this.getter('exists', id)
  }

  static select (fn) {
    return this.getter('select', fn)
  }

  static findBy (name, value) {
    return this.getter('findBy', name, value)
  }

  static findAllBy (name, value) {
    return this.getter('findAllBy', name, value)
  }

  static all () {
    return this.getter('all')
  }

  static deleteAll () {
    this.mutation('deleteAll')
  }

  static updateRecord (attributes) {
    this.mutation('updateRecord', attributes)
  }

  static addRecord (attributes) {
    this.mutation('addRecord', attributes)
  }

  static load (attributes) {
    // we need to update existing records
    // otherwise they will loose their reactivity
    if (this.exists(attributes.id)) {
      this.updateRecord(attributes)
    } else {
      this.addRecord(attributes)
    }
    return this.find(attributes.id)
  }

  static isNew (id) {
    return this.getter('isNew', id)
  }

  static delete (id) {
    this.mutation('delete', id)
  }

  static changeID (from, to) {
    this.mutation('changeID', {
      from,
      to
    })
  }

  // private

  static mutation (mutation, parameter) {
    this.store.commit(`${this.namespace}/${mutation}`, parameter)
  }

  static getter (getter) {
    // remove first argument (getter) to get real arguments
    const args = Array.prototype.slice.call(arguments, 1)
    return this.store.getters[`${this.namespace}/${getter}`](...args)
  }

  // instance

  // TODO: should be a getter
  isNew () {
    return this.constructor.isNew(this.id)
  }

  delete () {
    this.constructor.delete(this.id)
    this.reactiveAttributes = {}
  }

  changeID (to) {
    this.constructor.changeID(this.id, to)
  }

  save () {
    this.validate()
    // TODO: Handle validation errors?
    this.preserve()
  }

  attributes () {
    var result = {}
    this.properties.forEach(property => {
      result[property.name] = this[property.name]
    })
    return result
  }

  mutation () {
    this.constructor.mutation(...arguments)
  }

  getter () {
    return this.constructor.getter(...arguments)
  }

  // these might get overwritten in custom sub modules

  validate () {
  }

  // these should get overwritten for storing model base classes
  // like e.g. AJAX, LocalStorage etc.

  preserve () {
    console.warn(`[spine] missing preserve implementation for ${this.constructor.name} instance with ID ${this.id}.`)
  }

  destroy () {
    this.delete()
    console.warn(`[spine] missing destroy implementation for ${this.constructor.name} instance with ID ${this.id}.`)
  }

  //
  // private
  //

  _propertyConfig (property) {
    if (typeof property === 'object') return property
    if (typeof property === 'string') return {name: property}
    // TODO new Error('Invalid property', property)
    return
  }

  _initializeAssociation (property) {
    if (!this.constructor.associations) {
      this.associations = this.constructor.associations = {}
    }

    const association = this._associationConfig(property)

    if (!association.type) return

    this.constructor.associations[association.property] = association

    Object.defineProperty(this, association.accessor, association.definition)
  }

  _associationConfig (property) {
    var association = this._associationObject(property)

    this._associationType(association)

    if (association.type) {
      this._associationAccessor(association)
      this._associationClass(association)
      this._associationDefinition(association)
    }

    return association
  }

  _associationObject (property) {
    var association = property.association || {}
    association.property = property.name
    return association
  }

  _associationType (association) {
    // TODO: sanity check of type?
    if (association.type) return

    if (association.property.endsWith('_ids')) {
      association.type = 'has_many'
    } else if (association.property.endsWith('_id')) {
      association.type = 'has'
    }

    return
  }

  _associationAccessor (association) {
    if (association.accessor) return
    association.accessor = association.property.replace(/_id(s)?$/, '$1')
    return
  }

  _associationClass (association) {
    if (association.className) return
    association.className = classify(association.property.replace(/_ids?$/, ''))
    return
  }

  _associationDefinition (association) {
    if (association.type === 'has') {
      association.definition = {
        get () {
          if (this.deleted) return

          const associationId = this[association.property]
          return this.vm.$[association.className].find(associationId)
        },
        set (instance) {
          if (this.deleted) return

          this[association.property] = instance.id
        }
      }
    } else if (association.type === 'has_many') {
      association.definition = {
        get () {
          var instances = []
          const associationIds = this[association.property]
          associationIds.forEach(associationId => {
            var instance = this.vm.$[association.className].find(associationId)
            instances.push(instance)
          })
          return instances
        },
        set (instances) {
          if (this.deleted) return

          var instanceIds = []
          instances.forEach(instance => {
            instanceIds.push(instance.id)
          })

          this[association.property] = instanceIds
        }
      }
    }

    return
  }

  // TODO: isValid
  // TODO: eql
  // TODO: stripCloneAttrs
  // TODO: dup
  // TODO: clone
  // TODO: reload
  // TODO: refresh
  // TODO: toJSON
  // TODO: toString
}

