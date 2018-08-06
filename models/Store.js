const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const slug = require('slugs');

const storeSchema = new mongoose.Schema({
name: {                                          // store.name
  type: String,
  trim: true,
  required: 'Please enter a store name!'
},

slug : String,

description: {                                  //store.description
  type: String,
  trim: true
},

tags: [String],
created: {
  type: Date,
  default: Date.now
},

location: {

  type: {
    type: String,
    default: 'Point'
  },
  coordinates: [{
    type: Number,
    required: 'You must supply coordinates!'
  }],
  address: {                                     //store.location.address
    type: String,
    requried: 'You must supply an address'
    }
  },

  photo: String,

  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: ' You must supply an author'
  }
}, {
  // to bring the virtual (association data) up and running
  toJSON: { virtuals: true},
  toObject: { virtuals: true}
});


// define our indexes
storeSchema.index({
  name: 'text',
  description: 'text'
});

storeSchema.index({location: '2dsphere'});

storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')){
    next(); // skip it
    return; // stop the function from running
  };
  this.slug = slug(this.name);

  // find other stores that have a slug of brewery, brewery-1, brewery-2 ...
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');

  const storesWithSlug = await this.constructor.find({ slug: slugRegEx});
  if(storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
});


// our own static methods
// they are used when we need to do many queries/complexe queries
storeSchema.statics.getTagsList = function() {
  return this.aggregate([ // aggreggate takes an array of possible agreggations
    { $unwind: '$tags' }, // the dollar sign meeans tag is a field on my doc which i want to unwind
    { $group: { _id: '$tags', count: { $sum: 1 } }},
    { $sort: { count: -1}}
  ]);
};

storeSchema.statics.getTopStores = function() {
  return this.aggregate([
    // 1 . lookup stores and populate their reviews
    { $lookup:
      { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' }
    }, // from 'reviews' == mongoDB lowercase the Model Review and adds an S at the end'
    // as: is where you name the field

    // 2. filter for only items that have 2 or more reviews
    { $match:
      { 'reviews.1': { $exists: true } } // reviews.1 : is how we index in MongoDB
      //reviews.0 = 1 review, reviews.1 = 2 reviews, etc ...
    },
    // 3. add the average reviews field
    { $project:
      // with mongoDB we have to reset which fields we need, because they all dissapeared !
      {
        photo: '$$ROOT.photo',
        name: '$$ROOT.name',
        reviews: '$$ROOT.reviews',
        slug: '$$ROOT.slug',
        averageRating: { $avg: '$reviews.rating' }
        // create a new field averageRating,
        // and set it to the average of all reviews rating fields
        // the $reviews.rating, the $ sign means it's a field
      }
    },
    // 4. sort it by our new field, highest reviews first
    { $sort:
      { averageRating: -1 }
    },

    { $limit: 10 }
    // 5. limit to at most 10

  ]);
}

// association ente 2 tables
// find reviews where the stores _id === reviews store property
storeSchema.virtual('reviews', {
  ref: 'Review', // what model to link
  localField: '_id',  // which field on our store model
  foreignField: 'store' // which field on the Review Model
});

function autopopulate(next) {
  this.populate('reviews');
  next();
};


// when,ever i query a store, it should populate all the reviews for that store :
storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);
