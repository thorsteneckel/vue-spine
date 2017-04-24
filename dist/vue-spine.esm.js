/**
 * vue-spine v0.0.4
 * (c) 2017 Thorsten Eckel
 * @license MIT
 */
import Vue from 'vue';

var classify = function (str) {
  var camelCase = str.replace(/[-_\s]+(.)?/g, function (match, c) {
    return c ? c.toUpperCase() : ''
  });

  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1)
};

var storeModule = {
  namespaced: true,
  state: function state () {
    return {
      records:    {},
      tmpRecords: []
    }
  },
  mutations: {
    addTemporary: function addTemporary (state, id) {
      state.tmpRecords.push(id);
    },
    changeID: function changeID (state, payload) {
      // we have to use Vue here to be reactive
      // see: https://github.com/vuejs/vuex/issues/259
      Vue.set(state.records, payload.to, state.records[payload.from]);
      Vue.delete(state.records, payload.from);

      state.records[payload.to].id = payload.to;
    },
    updateAttribute: function updateAttribute (state, payload) {
      var record = state.records[payload.id];
      record[payload.name] = payload.value;
    },
    delete: function delete$1 (state, id) {
      // we have to use Vue here to be reactive
      // see: https://github.com/vuejs/vuex/issues/259
      Vue.delete(state.records, id);
    },
    deleteAll: function deleteAll (state) {
      state.records = {};
      state.tmpRecords = [];
    },
    addRecord: function addRecord (state, attributes) {
      // we have to use Vue here to be reactive
      // see: https://github.com/vuejs/vuex/issues/259
      Vue.set(state.records, attributes.id, attributes);
    },
    updateRecord: function updateRecord (state, attributes) {
      var record = state.records[attributes.id];

      Object.keys(attributes).sort().forEach(function (key) {
        if (key === 'id') { return }
        record[key] = attributes[key];
      });
    }
  },
  getters: {
    isNew: function (state) { return function (id) {
      return Boolean(state.tmpRecords.find(function (tmpId) { return tmpId === id; }))
    }; },
    find: function (state) { return function (id) {
      return state.records[id]
    }; },
    findAll: function (state) { return function (ids) {
      var records = [];
      ids.forEach(function (id) {
        var record = state.records[id];
        if (!record) { return }
        records.push(record);
      });
      return records
    }; },
    exists: function (state, getters) { return function (id) {
      return Boolean(getters.find(id))
    }; },
    select: function (state) { return function (callback) {
      var records = [];
      Object.keys(state.records).sort().forEach(function (id) {
        var record = state.records[id];

        if (!callback(record)) { return }

        // console.log('records.length', records.length)
        Vue.set(records, records.length, record);
        // records.push(record)
      });
      return records
    }; },
    findBy: function (state) { return function (name, value) {
      var found;

      // http://stackoverflow.com/a/2641374
      Object.keys(state.records).sort().some(function (id) {
        var record = state.records[id];

        if (record[name] === value) {
          found = record;
          return true
        }
      });

      return found
    }; },
    findAllBy: function (state, getters) { return function (name, value) {
      return getters.select(function (record) {
        return record[name] === value
      })
    }; },
    all: function (state, getters) { return function () {
      return getters.select(function (record) {
        return true
      })
    }; }
  }
};

var Model = function Model (attrs) {
  var this$1 = this;
  if ( attrs === void 0 ) attrs = {};

  this.store = this.constructor.store;
  this.vm = this.constructor.vm;
  this.namespace = this.constructor.namespace;
  this.conf = this.constructor.conf;

  // TODO: check if attributes are valid

  this.properties = this.constructor.attributes.slice();

  this.properties.forEach(function (property) {
    if (attrs[property.name]) { return }
    // TODO: default values?
    attrs[property.name] = null;
  });

  // add id to properties list
  this.properties.push({
    name: 'id'
  });

  if (!this.constructor.idCounter) {
    this.constructor.idCounter = 1;
  }

  this.reactiveAttributes = {};
  if (!attrs.id) {
    attrs.id = this.constructor.uid('c-');
    this.reactiveAttributes.id = attrs.id;

    this.mutation('addTemporary', attrs.id);

    // since the result of .load might be a promise we have
    // to handle non-Promises results as if they were such
    // source: http://stackoverflow.com/a/39191573
    Promise.resolve(this.constructor.load(attrs)).then(function (result) {
      this$1.reactiveAttributes = result;
    });
  } else {
    this.reactiveAttributes = attrs;
  }

  // console.log('HERE constructor', this.constructor.name)
  // console.trace()

  this.associations = {};
  this.properties.forEach(function (entry) {
    var property = this$1._propertyConfig(entry);

    this$1._initializeAssociation(property);

    var definition = {
      get: function get () {
        if (this.deleted) { return }
        return this.reactiveAttributes[property.name]
      }
    };

    // TODO: might print an error when trying to set ID?
    if (property.name !== 'id') {
      Object.assign(definition, {
        set: function set (value) {
          if (this.deleted) { return }

          // we _could_ use direct access like:
          // this.reactiveAttributes[property.name] = value
          // but use the VueX API to be strict mode compatible
          this.mutation('updateAttribute', {
            id:  this.id,
            name:property.name,
            value: value
          });
        }
      });
    }

    Object.defineProperty(this$1, property.name, definition);
  });
};

var staticAccessors = { attributes: {} };

Model.registerStore = function registerStore (vm, namespace, conf) {
  this.vm = vm;
  this.store = this.vm.$store;
  this.namespace = namespace;
  this.conf = conf;

  var existingRegistration = this.vm.$[namespace];

  if (existingRegistration) {
    if (existingRegistration.name !== this.name) {
      console.error(("[spine] differing model registration: " + (this.name) + " as " + namespace + ", but " + (existingRegistration.name) + " is registered"));
    }
    return
  }

  this.vm.$[namespace] = this;

  this.store.registerModule(namespace, storeModule);
};

staticAccessors.attributes.get = function () {
  return [{name: 'name'}]
};

Model.uid = function uid (prefix) {
    if ( prefix === void 0 ) prefix = '';

  var uid = prefix + this.idCounter++;
  // put your recursion glasses on 8-)
  if (this.exists(uid)) { uid = this.uid; }
  return uid
};

Model.find = function find (id) {
  var reactiveObject = this.getter('find', id);
  if (!reactiveObject) { return }
  return new this(reactiveObject)
};

Model.findAll = function findAll (ids) {
  return this.getter('findAll', ids)
};

Model.exists = function exists (id) {
  return this.getter('exists', id)
};

Model.select = function select (fn) {
  return this.getter('select', fn)
};

Model.findBy = function findBy (name, value) {
  return this.getter('findBy', name, value)
};

Model.findAllBy = function findAllBy (name, value) {
  return this.getter('findAllBy', name, value)
};

Model.all = function all () {
  return this.getter('all')
};

Model.deleteAll = function deleteAll () {
  this.mutation('deleteAll');
};

Model.updateRecord = function updateRecord (attributes) {
  this.mutation('updateRecord', attributes);
};

Model.addRecord = function addRecord (attributes) {
  this.mutation('addRecord', attributes);
};

Model.load = function load (attributes) {
  // we need to update existing records
  // otherwise they will loose their reactivity
  if (this.exists(attributes.id)) {
    this.updateRecord(attributes);
  } else {
    this.addRecord(attributes);
  }
  return this.find(attributes.id)
};

Model.isNew = function isNew (id) {
  return this.getter('isNew', id)
};

Model.delete = function delete$1 (id) {
  this.mutation('delete', id);
};

Model.changeID = function changeID (from, to) {
  this.mutation('changeID', {
    from: from,
    to: to
  });
};

// private

Model.mutation = function mutation (mutation$1, parameter) {
  this.store.commit(((this.namespace) + "/" + mutation$1), parameter);
};

Model.getter = function getter (getter$1) {
  // remove first argument (getter) to get real arguments
  var args = Array.prototype.slice.call(arguments, 1);
  return (ref = this.store.getters)[((this.namespace) + "/" + getter$1)].apply(ref, args)
    var ref;
};

// instance

// TODO: should be a getter
Model.prototype.isNew = function isNew () {
  return this.constructor.isNew(this.id)
};

Model.prototype.delete = function delete$2 () {
  this.constructor.delete(this.id);
  this.reactiveAttributes = {};
};

Model.prototype.changeID = function changeID (to) {
  this.constructor.changeID(this.id, to);
};

Model.prototype.save = function save () {
  this.validate();
  // TODO: Handle validation errors?
  this.preserve();
};

Model.prototype.attributes = function attributes () {
    var this$1 = this;

  var result = {};
  this.properties.forEach(function (property) {
    result[property.name] = this$1[property.name];
  });
  return result
};

Model.prototype.mutation = function mutation () {
  (ref = this.constructor).mutation.apply(ref, arguments);
    var ref;
};

Model.prototype.getter = function getter () {
  return (ref = this.constructor).getter.apply(ref, arguments)
    var ref;
};

// these might get overwritten in custom sub modules

Model.prototype.validate = function validate () {
};

// these should get overwritten for storing model base classes
// like e.g. AJAX, LocalStorage etc.

Model.prototype.preserve = function preserve () {
  console.warn(("[spine] missing preserve implementation for " + (this.constructor.name) + " instance with ID " + (this.id) + "."));
};

Model.prototype.destroy = function destroy () {
  this.delete();
  console.warn(("[spine] missing destroy implementation for " + (this.constructor.name) + " instance with ID " + (this.id) + "."));
};

//
// private
//

Model.prototype._propertyConfig = function _propertyConfig (property) {
  if (typeof property === 'object') { return property }
  if (typeof property === 'string') { return {name: property} }
  // TODO new Error('Invalid property', property)
  return
};

Model.prototype._initializeAssociation = function _initializeAssociation (property) {
  if (!this.constructor.associations) {
    this.associations = this.constructor.associations = {};
  }

  var association = this._associationConfig(property);

  if (!association.type) { return }

  this.constructor.associations[association.property] = association;

  Object.defineProperty(this, association.accessor, association.definition);
};

Model.prototype._associationConfig = function _associationConfig (property) {
  var association = this._associationObject(property);

  this._associationType(association);

  if (association.type) {
    this._associationAccessor(association);
    this._associationClass(association);
    this._associationDefinition(association);
  }

  return association
};

Model.prototype._associationObject = function _associationObject (property) {
  var association = property.association || {};
  association.property = property.name;
  return association
};

Model.prototype._associationType = function _associationType (association) {
  // TODO: sanity check of type?
  if (association.type) { return }

  if (association.property.endsWith('_ids')) {
    association.type = 'has_many';
  } else if (association.property.endsWith('_id')) {
    association.type = 'has';
  }

  return
};

Model.prototype._associationAccessor = function _associationAccessor (association) {
  if (association.accessor) { return }
  association.accessor = association.property.replace(/_id(s)?$/, '$1');
  return
};

Model.prototype._associationClass = function _associationClass (association) {
  if (association.className) { return }
  association.className = classify(association.property.replace(/_ids?$/, ''));
  return
};

Model.prototype._associationDefinition = function _associationDefinition (association) {
  if (association.type === 'has') {
    association.definition = {
      get: function get () {
        if (this.deleted) { return }

        var associationId = this[association.property];
        return this.vm.$[association.className].find(associationId)
      },
      set: function set (instance) {
        if (this.deleted) { return }

        this[association.property] = instance.id;
      }
    };
  } else if (association.type === 'has_many') {
    association.definition = {
      get: function get () {
          var this$1 = this;

        var instances = [];
        var associationIds = this[association.property];
        associationIds.forEach(function (associationId) {
          var instance = this$1.vm.$[association.className].find(associationId);
          instances.push(instance);
        });
        return instances
      },
      set: function set (instances) {
        if (this.deleted) { return }

        var instanceIds = [];
        instances.forEach(function (instance) {
          instanceIds.push(instance.id);
        });

        this[association.property] = instanceIds;
      }
    };
  }

  return
};

Object.defineProperties( Model, staticAccessors );

var LegacyModel = (function (Model$$1) {
  function LegacyModel () {
    Model$$1.apply(this, arguments);
  }

  if ( Model$$1 ) LegacyModel.__proto__ = Model$$1;
  LegacyModel.prototype = Object.create( Model$$1 && Model$$1.prototype );
  LegacyModel.prototype.constructor = LegacyModel;

  LegacyModel.findByAttribute = function findByAttribute () {
    return (ref = this).findBy.apply(ref, arguments)
    var ref;
  };

  LegacyModel.findAllByAttribute = function findAllByAttribute () {
    return (ref = this).findAllBy.apply(ref, arguments)
    var ref;
  };

  LegacyModel.prototype.updateAttribute = function updateAttribute (name, value) {
    var attributes = {};
    attributes[name] = value;
    this.updateAttributes(attributes);
  };

  LegacyModel.prototype.updateAttributes = function updateAttributes (attributes) {
    var this$1 = this;

    Object.keys(attributes).forEach(function (name) {
      this$1[name] = attributes[name];
    });
    this.save();
  };

  LegacyModel.prototype.attributes = function attributes () {
    var this$1 = this;

    var result = {};
    this.properties.forEach(function (property) {
      result[property.name] = this$1[property.name];
    });
    return result
  };

  LegacyModel.prototype.exists = function exists () {
    return this.constructor.exists(this.id)
  };

  // alias to support Spine API
  LegacyModel.prototype.remove = function remove () {
    this.delete();
  };

  return LegacyModel;
}(Model));

var Vue$1;

var install = function (_Vue, conf) {
  if ( conf === void 0 ) conf = {};

  if (Vue$1) {
    console.error(
      '[spine] already installed. Vue.use(Spine) should be called only once.'
    );
    return
  }
  Vue$1 = _Vue;

  var usesInit = Vue$1.config._lifecycleHooks.indexOf('init') > -1;
  Vue$1.mixin(usesInit ? { init: spineInit } : { beforeCreate: spineInit });

  function spineInit () {
    var this$1 = this;

    var options = this.$options;

    if (!this.$) {
      if (options.parent && options.parent.$) {
        this.$ = options.parent.$;
      } else {
        this.$ = {};
      }
    }

    // spine injection
    if (options.spine) {
      Object.keys(options.spine).forEach(function (namespace) {
        var classDefinition = options.spine[namespace];

        classDefinition.registerStore(this$1, namespace, conf);
      });
    }
  }
};

var index_esm = {
  Model: Model,
  LegacyModel: LegacyModel,
  storeModule: storeModule,
  install: install,
  version: '0.0.4'
};

export { Model, LegacyModel, storeModule, install };export default index_esm;
