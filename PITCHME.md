---

### Vue-Spine

<span style="color:gray">Reactive models based on ES6 classes and Vuex.</span>

---

> Vue-Spine aims to replace `fetchPostById` / `updatePost` Vuex mutations/actions
> with a DRYed up model API like `Post.find` or `post.update`.

---

### Under the hood

- ES6 classes
- Vuex modules

---

### Capabilities

- API with expandability in mind
- REST support
- Other backends (e.g. LocalStorage) easily possible

---

### Model API

- Spine.js / Backbone.js
- Rails ActiveRecord
- Backwards compatibility

---

### Model definition example

```javascript
// models/post.js

import { RestModel } from 'vue-spine'

class Post extends RestModel {

  static get attributes () {
    return ['title', 'body', 'comment_ids']
  }
}

export default Post

```

---

### Class method API examples

```javascript
Post.find(1)
Post.findBy('title', 'Vue-Spine talk')
Post.findAllBy('title', 'Vue-Spine talk')
Post.exists()
Post.all()
Post.load()
...
```

---

### Instance method API examples

```javascript
post.title = 'Update title'
post.save
post.comments
...
```

---

### DEMO

---

### How?

- Vuex modules
- Object.defineProperty (ES6 Proxy Traps?)
- Vuex "wrapper"
- ES6 class inheritance / extends

---

### Roadmap

- [x] PoC
- [x] Presentation
- [ ] Feedback
- [ ] Github issues / TODOs
- [ ] Real world usage 🚀

---

### Thanks 🎉
