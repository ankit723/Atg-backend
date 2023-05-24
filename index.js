import express from "express"
import cors from 'cors'
import mongoose from "mongoose"

const app = express()
app.use(express.json())
app.use(express.urlencoded())
app.use(cors())

mongoose.connect('mongodb+srv://ankitBiwas:.mjo9876@cluster0.uriv4tp.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
  
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
  db.once('open', () => {
    console.log('Connected to MongoDB');
  });

//User Schema

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
})

const User = new mongoose.model("User", userSchema)


//Post Schema
const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const Post = mongoose.model('Post', postSchema);


//Routes


app.post("/login", async(req, res)=> {
    const{ username, password}=req.body
    const user= await User.findOne({ username })
    if(user){
        if(password===user.password){
          return res.send({ message: 'User Logged In' , user:user});
        }else{
          return res.send({ message: 'Invalid password' });
        }
    }else{
      return res.send({ message: 'User not found' });
    }
  }
)

app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.send({ message: 'Email already registered' });
    }

    // Create a new user document
    const user = new User({ username, email, password });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('User registration error:', error);
    res.send({ message: 'Server error' });
  }
});

//Forgot Password
app.post('/forgot', (req, res)=>{
  const{username, email}=req.body;
  User.findOne({username:username})
  .then((user)=>{
    if(user){
      const real_email=user.email;
      if(real_email===email){
        const pass=user.password;
        return res.send({message:"Password:", pass})
      } else{
        return res.send({message:"Email is Wrong"})
      }
    }else{
      return res.send({message:"User Not Found"})
    }
  })
  .catch((err)=>{
    console.error("Error Fetching User", err)
  })
});

// Create a post item
app.post('/post', async (req, res) => {
  try {
    const { title, userId } = req.body;

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create a new TODO item
    const post = new Post({
      title,
      user: user._id,
    });
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: 'Bad request' });
  }
});

//get the post item to the frontend that only user posted
app.get('/post', async (req, res) => {
  try {
    const { title, userId } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // console.log(user)

    const posts = await Post.find({user:user._id});
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

//get the post item to the frontend that every user posted
app.get('/otherpost', async (req, res) => {
  try {
    const { title, userId } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const posts = await Post.find({user:{$ne:user._id}});
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


//Delete the Post
app.post('/postdelete', async (req, res)=> {
  try{
    const {postId}=req.body;
    const removedPost=await Post.findByIdAndDelete(postId);
    console.log("Post was removed")
  } catch(err){
    console.log("error deleting post", err)
  }
  
});


//Update the Post
app.post('/postupdate', (req, res)=> {
  const {postId, newtitle}=req.body;

  Post.findByIdAndUpdate(postId, {title:newtitle}, {new:true})
  .then((updatedPost)=>{
    console.log('Post updated successfully:', updatedPost);
  })
  .catch((err)=>{
    console.error('Error updating post:', err)
  })
  
});

app.listen(9002, ()=>{
    console.log("BE Started at port 9002")
})