# Vue-Spine

> Reactive models based on ES6 classes and Vuex..

## What is Vue-Spine?

Vue-Spine is a Vue.js plugin based on the Vuex state management. It enables the usage of ES6 class based models. There is a short [git-pitch presentation](https://gitpitch.com/thorsteneckel/vue-spine) about it.

The `Model` API is strongly inspired by [Spine.js](https://github.com/spine/spine) (similar/slim [Backbone.js](http://backbonejs.org/)) which is inspired by [Rails](https://github.com/rails/rails) [ActiveRecord](https://github.com/rails/rails/tree/master/activerecord). For an example see below.

The included `Model` base class provides only temporary storage in Vuex. It can be extend to store the data in any place. Currently the `RestModel` is included which provides basic communication with a CRUD REST endpoint.

__ATTENTION:__ Vue-Spine is currently in development and not ready to use. The API will likely change.

Vue-Spine aims to provide a smooth transition from Spine.js to Vue.js and provides a `LegacyMode` which tries to be full API compatible. However this is not always possible and a secondary goal. This model will get removed in the future or moved to an own package.

## Example

```js
// main.js

// VENDOR
import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

var store = new Vuex.Store({
  strict: true
})

// REST support
import VueAxios from './lib/vue-axios'
Vue.use(VueAxios, {
  baseURL: 'https://jsonplaceholder.typicode.com'
})

// CUSTOM

// Vue-Spine support
import Spine from 'vue-spine'
Vue.use(Spine)

// example model
import Post from './models/post'

// COMPONENTS
import App from './app.vue'

// GLOBAL COMPONENT
new Vue({
  store,
  spine:      { Post },
  el:         '#app',
  template:   '<App/>',
  components: { App }
})
```

```js
// models/post.js

import { RestModel } from 'vue-spine'

class Post extends RestModel {

  static get attributes () {
    return ['title', 'body']
  }
}

export default RestModel
```

```vue
<!-- app.vue -->

<template>
  <div id="app">
    <button @click="createPost">create Post</button>
    <button @click="fetchPosts">fetch Posts</button>
    <button @click="updatePost">update Post</button>
    <button @click="destroyPost">destroy Post</button>
    <div v-for="post in posts">
      <span>{{ post.title }}</span>
      <span>{{ post.body }}</span>
    </div>
  </div>
</template>

<script>
// one of multiple ways to use the model:
import Post from './models/post'

new Vue({
  computed: {
    posts () {
      return Post.all()
    }
  },
  // mounted () {
  //   Post.fetch()
  // },
  methods: {
    createPost () {
      var newPost = new Post()

      newPost.title = 'Hello :)'
      newPost.body  = 'This instance is already a part of Post.all() - and reactive'

      // push it to the server
      newPost.save()
    },
    updatePost () {
      // delete local and remote
      Post.find(1).then(post => {
        post.title = 'Changed :)'

        // push it to the server
        post.save()
      })
    },
    fetchPosts () {
      Post.fetch()
    },
    destroyPost () {
      // delete local and remote
      Post.find(1).then(post => {
        post.destroy()
      })
    }
  }
})
</script>
```
