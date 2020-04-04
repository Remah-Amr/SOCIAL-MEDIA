const express = require('express');
const router = express.Router();
const { Post } = require('../models/post');
const { User } = require('../models/user');
const login = require('../middelware/login');
const isAdmin = require('../middelware/isAdmin')

// Show Single POST
router.get('/show/:id', login, (req, res) => {
  Post.findOne({
    _id: req.params.id
  })
    .populate('user')
    .populate('comments.commentUser')
    .then(post => {
      res.json({ post })
    }).catch(error => {
      res.status(400).json({ error })
    })
});


// add post
router.post('/', login, (req, res) => {
  let allowComments;
  if (req.body.allowComments) {
    allowComments = true;
  }
  else {
    allowComments = false;
  }

  const newPost = {
    title: req.body.title,
    status: req.body.status,
    allowComments: allowComments,
    body: req.body.body,
    user: req.user._id,
    likes: 0
  }

  new Post(newPost).save().then(post => {
    res.status(200).json({ post }) // we put ${} because we in js file not handlebars
  }).catch(error => {
    console.log("error");
    res.status(400).json({ error })
  })
})


// Edit post
router.put('/:id', login, (req, res) => { // i can put url same but method differnt , mean i can put get and post with the same url
  Post.findOne({ // because don't return array 'maybe'
    _id: req.params.id
  })
    .then(post => {
      let allowComments;

      if (req.body.allowComments) {
        allowComments = true;
      } else {
        allowComments = false;
      }

      // New values
      post.title = req.body.title;
      post.body = req.body.body;
      post.status = req.body.status;
      post.allowComments = allowComments;

      post.save()
        .then(post => { // post after save
          res.status(201).json({ post })
        });
    }).catch(error => {
      res.status(400).json({ error })
    });
});


// DELETE post
router.delete('/:id', login, (req, res) => {
  Post.deleteOne({ _id: req.params.id })
    .then(() => {
      res.status(204).json({ msg: "successful" })
    }).catch(error => {
      console.log("error");
      res.status(400).json({ error })
    })
})


// get posts from specific users
router.get('/user/:userId', login, (req, res) => {
  Post.find({
    user: req.params.userId, status: 'public'
  }).populate('user')
    .then(posts => {
      res.status(200).json({ posts })
    }).catch(error => {
      console.log("error");
      res.json({ error })
    })
})

// get my post 
router.get('/my', login, (req, res) => {
  Post.find({
    user: req.user._id
  }).populate('user')
    .then(posts => {
      res.json({ post })
    }).catch(error => {
      console.log("error");
      res.json({ error })
    })
})

// Add Commnt
router.post('/comment/:id', login, (req, res) => {
  Post.findOne({
    _id: req.params.id
  }).then(post => {
    console.log("enter")
    console.log(req.user)
    // New Comments
    const newComment = {
      commentBody: req.body.commentBody, // name in form of input
      commentUser: req.user._id
    }
    // comments is an array in model like this = [ {},{},{} ]
    // Add to comment array in first
    post.comments.unshift(newComment);

    post.save().then(post => {
      res.status(200).json({ post })
    })

  }).catch(error => {
    console.log("error");
    res.status(400).json({ error })
  })
})


// Add like
router.post('/like/:id', login, (req, res) => {
  Post.findOne({
    _id: req.params.id
  }).then(post => {
    // New Like
    post.likes = post.likes + 1;
    post.save().then(post => {
      res.status(200).json({ post })
    })

  }).catch(error => {
    console.log("error");
    res.status(400).json({ error })
  })
})


router.get('/admin/:id',isAdmin, async (req, res, next) => {
  const posts = await Post.find({ user: req.params.id }).populate('user')
  res.json({ posts, count: posts.length })
})

router.post('/admin/:postID', isAdmin, async (req, res, next) => {
  const post = await Post.findOne({ _id: req.params.postID })
  post.allowComments = req.body.allowComments
  await post.save()
  res.json({ post })
})

module.exports = router