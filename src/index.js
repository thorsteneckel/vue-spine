import Model from './model'
import LegacyModel from './legacy-model'
import storeModule from './store-module'
import install from './mixin'

export default {
  Model,
  LegacyModel,
  storeModule,
  install,
  version: '__VERSION__'
}

export {
  Model,
  LegacyModel,
  storeModule,
  install
}
