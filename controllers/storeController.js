const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next){
    const isPhoto = file.mimetype.startsWith('image/');
    if(isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That filetype isn\'t allowed'}, false);
    }
  }
};

exports.homePage = (req, res) => {
  // console.log(req.name);
  // req.flash('error', 'Something happenned');
  res.render('index');
};


exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store'});
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    next(); // skip to the next middleware
    return;
  }
  // console.log(req.file);
  const extension= req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written the photo to our filesystem, keep going !
  next();
};

exports.createStore = async (req, res) => { // for the await5b6579f52dc32126b9901621
  req.body.author = req.user._id; // takes the id of the current user , populate in body
  // res.json(req.body);
  const store = await (new Store(req.body)).save();
  await store.save(); // await until the save() has passed you can continue
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req,res) => {

  // pagination :
  const page = req.params.page || 1;
  const limit = 4;
  const skip = (page * limit) - limit;

  // Version 1 of our query :
  // const stores = await Store
  //   .find() // 1 query the DB for a list of all stores
  //   .skip(skip)
  //   .limit(limit)

  // Version 2 of our query, with a Promise :
  const storesPromise =  Store
    .find() // 1 query the DB for a list of all stores
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });
  const countPromise = Store.count();
  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  const pages = Math.ceil(count / limit);
  if(!stores.length && skip) {
    req.flash('info', `Hey! You asked for page ${page}. But it doesn't exist. So I put you on page ${pages}.`);
    res.redirect(`/stores/page/${pages}`);
    return;
  }
  // console.log(stores);
  res.render('stores', {title: 'Stores', stores, page, pages, count});
};

// check if the user is the author of the store
const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    // method .equals is because we need to compare an object (store.author) and a stirng(user.id)
    throw Error('You must own a store in order to edit it!');
  }
};

exports.editStore = async (req, res) => {
// Find the store given the ID
  // res.json(req.params);
  const store = await Store.findOne({ _id: req.params.id});
  // res.json(store);
// Confirm they are the owner of the store
confirmOwner(store, req.user);
// Render out the edit form so the user can update their store
  res.render('editStore', {title: `Edit ${store.name}`, store})
};

exports.updateStore = async (req, res) => {
  // set the location data to be a point again
  req.body.location.type = 'Point';
  // find and update the store : findOneAndUpdate(query, data, options)
  const store = await Store.findOneAndUpdate(
    {_id: req.params.id},
    req.body,
    {
      new: true, // return the new store instead of the old one
      runValidators: true // force our models to run the required validators
    }).exec(); // force the query to run
    req.flash('success', `Successfully updated
    <strong>${store.name}</strong>
    <a href="/stores/${store.slug}">View Store</a>`);
    res.redirect(`/stores/${store._id}/edit`);
  // redirect the store and tell them it worked
};

exports.getStoreBySlug = async (req, res, next) => {
  // res.send('It works');
  // res.json(req.params);
  const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews');
  // populate is when you have an association between 2 tables
  // here i popiulate store with author and review info

  // res.json(store);
  if(!store) return next();
  res.render('store', { store, title: store.name });
};

exports.getStoreByTag = async (req, res) => {
  // res.send('it works');
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

  // const tags = await Store.getTagsList(); // we create our own static method
  // res.json(stores);
  res.render('tag', { tags, title: 'Tags', tag, stores });
};

exports.searchStores = async (req, res) => {
  // res.json(req.query);
  const stores = await Store
// find stores that match
  .find({
    $text: {
      $search: req.query.q
    }
  },{
    score: { $meta: 'textScore' }  // ASC
  })
// then sort them
  .sort({
    score: { $meta: 'textScore' }  // DESC
  })
//  Limit to  5 results
  .limit(5);
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  // res.json({it: "worked!"});
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  //parsefloat transofrms the string in number
  // res.json(coordinates);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000  // = 10 KM
      }
    }
  }

  const stores = await Store.find(q).select('slug name description location photo').limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render('map', {title: "Map"})
};


exports.heartStore = async (req,res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User
    .findOneAndUpdate(
      req.user._id,
      { [operator]: { hearts: req.params.id} },
      { new: true }
    );

  //$pull = mongodb for removing
  // $addToSet= push unique (not twice)
  // console.log(hearts);
  res.json(user);
};

exports.getHearts = async (req,res) => {
  const stores = await Store.find({
    _id: { $in: req.user.hearts }   // find the stores where the id is in an array
  });
  // res.json(stores)
  res.render('stores', { title: 'Hearted Stores', stores });
};

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  // we find this static method in our Model
  // there are a lot of queries , it's best to make a function
  res.render('topStores', { stores, title: `★ Top Stores!`});
  // res.json(stores);
};
