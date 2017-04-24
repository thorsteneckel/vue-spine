import Vue from 'vue'

export default {
  namespaced: true,
  state () {
    return {
      records:    {},
      tmpRecords: []
    }
  },
  mutations: {
    addTemporary (state, id) {
      state.tmpRecords.push(id)
    },
    changeID (state, payload) {
      // we have to use Vue here to be reactive
      // see: https://github.com/vuejs/vuex/issues/259
      Vue.set(state.records, payload.to, state.records[payload.from])
      Vue.delete(state.records, payload.from)

      state.records[payload.to].id = payload.to
    },
    updateAttribute (state, payload) {
      var record = state.records[payload.id]
      record[payload.name] = payload.value
    },
    delete (state, id) {
      // we have to use Vue here to be reactive
      // see: https://github.com/vuejs/vuex/issues/259
      Vue.delete(state.records, id)
    },
    deleteAll (state) {
      state.records = {}
      state.tmpRecords = []
    },
    addRecord (state, attributes) {
      // we have to use Vue here to be reactive
      // see: https://github.com/vuejs/vuex/issues/259
      Vue.set(state.records, attributes.id, attributes)
    },
    updateRecord (state, attributes) {
      var record = state.records[attributes.id]

      Object.keys(attributes).sort().forEach(key => {
        if (key === 'id') return
        record[key] = attributes[key]
      })
    }
  },
  getters: {
    isNew: (state) => (id) => {
      return Boolean(state.tmpRecords.find(tmpId => tmpId === id))
    },
    find: (state) => (id) => {
      return state.records[id]
    },
    findAll: (state) => (ids) => {
      var records = []
      ids.forEach(id => {
        var record = state.records[id]
        if (!record) return
        records.push(record)
      })
      return records
    },
    exists: (state, getters) => (id) => {
      return Boolean(getters.find(id))
    },
    select: (state) => (callback) => {
      var records = []
      Object.keys(state.records).sort().forEach(id => {
        var record = state.records[id]

        if (!callback(record)) return

        // console.log('records.length', records.length)
        Vue.set(records, records.length, record)
        // records.push(record)
      })
      return records
    },
    findBy: (state) => (name, value) => {
      var found

      // http://stackoverflow.com/a/2641374
      Object.keys(state.records).sort().some(id => {
        var record = state.records[id]

        if (record[name] === value) {
          found = record
          return true
        }
      })

      return found
    },
    findAllBy: (state, getters) => (name, value) => {
      return getters.select(record => {
        return record[name] === value
      })
    },
    all: (state, getters) => () => {
      return getters.select(record => {
        return true
      })
    }
  }
}
