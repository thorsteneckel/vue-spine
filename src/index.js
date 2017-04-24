import Model from './model'
import RestModel from './rest-model'
import LegacyModel from './legacy-model'
import storeModule from './store-module'
import install from './mixin'

export default {
  Model,
  RestModel,
  LegacyModel,
  storeModule,
  install,
  version: '__VERSION__'
}
