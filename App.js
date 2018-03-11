import React from 'react'
import Blog from './components/Blog'
import BlogForm from './components/BlogForm'
import Notification from './components/Notification'
import Togglable from './components/Togglable'
import blogService from './services/blogs'
import loginService from './services/login'
import { getAll } from './services/users' 
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'


class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      blogs: [],
      user: null,
      username: '',
      password: '', 
      title: '',
      author: '',
      url: '',
      notification: null,
      users: []
    }
  }

  componentWillMount() {
    blogService.getAll().then(blogs =>
      this.setState({ blogs })
    )
    getAll().then(users =>
    this.setState({users})
    )

    const loggedUserJSON = window.localStorage.getItem('loggedBlogAppUser')
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      this.setState({ user })
      blogService.setToken(user.token)
    }
  } 

  notify = (message, type = 'info') => {
    this.setState({
      notification: {
        message, type
      }
    })
    setTimeout(() => {
      this.setState({
        notification: null
      })     
    }, 10000)
  }

  like = (id) => async () => {
    const liked = this.state.blogs.find(b=>b._id===id)
    const updated = { ...liked, likes: liked.likes + 1 }
    await blogService.update(id, updated)
    this.notify(`you liked '${updated.title}' by ${updated.author}`)
    this.setState({
      blogs: this.state.blogs.map(b => b._id === id ? updated : b)
    })
  }

  remove = (id) => async () => {
    const deleted = this.state.blogs.find(b => b._id === id)
    const ok = window.confirm(`remove blog '${deleted.title}' by ${deleted.author}?`)
    if ( ok===false) {
      return
    }

    await blogService.remove(id)
    this.notify(`blog '${deleted.title}' by ${deleted.author} removed`)
    this.setState({
      blogs: this.state.blogs.filter(b=>b._id!==id)
    })
  }

  addBlog = async (event) => {
    event.preventDefault()
    const blog = {
      title: this.state.title,
      author: this.state.author,
      url: this.state.url,
    }
    
    const result = await blogService.create(blog) 
    this.notify(`blog '${blog.title}' by ${blog.author} added`)
    this.setState({ 
      title: '', 
      url: '', 
      author: '',
      blogs: this.state.blogs.concat(result)
    })
  }

  logout = () => {
    window.localStorage.removeItem('loggedBlogAppUser')
    this.notify('logged out')
    this.setState({ user: null })
  }

  login = async (event) => {
    event.preventDefault()
    try {
      const user = await loginService.login({
        username: this.state.username,
        password: this.state.password
      })

      window.localStorage.setItem('loggedBlogAppUser', JSON.stringify(user))
      blogService.setToken(user.token)
      this.notify('welcome back!')
      this.setState({ username: '', password: '', user })
    } catch (exception) {
      this.notify('käyttäjätunnus tai salasana virheellinen', 'error')
      setTimeout(() => {
        this.setState({ error: null })
      }, 5000)
    }
  }

  handleLoginChange = (event) => {
    this.setState({ [event.target.name]: event.target.value })
  }






  render() {

    const User = ({user}) => {
      return(
      <div>
        <h2>{user.username}</h2>
        <ul>
          {user.blogs.map(blog => 
          <li>
            {blog.title}
            </li>
          )}
          </ul>
      </div>
    )}

    const Blogir = ({blog}) => {

      return(
        <Blog 
            key={blog._id} 
            blog={blog} 
            like={this.like(blog._id)}
            remove={this.remove(blog._id)}
            deletable={blog.user === undefined || blog.user.username === this.state.user.username}
          />
    )}
    
    
    const userById =  (id) => {
    const user = this.state.users.find(user => user._id == id)
    if(!user){
      return null
    } else {
      return user
      }
    }

   const blogById = (id) => {
    const blogi = this.state.blogs.find(blog => blog._id == id)
    if(!blogi){
      return null
    } else {
      return blogi
    }
    }

    const Users = () => (
      <div>
        <h2>Kayttajat</h2>
        <ul>
        {this.state.users.map(user=>
        <li key={user._id}>

          <Link to={`/users/${user._id}`}>{user.username}</Link>

        </li>
      )}
    </ul>  
      </div>
    )
    const Blogs = () => (
      <div>
      <Togglable buttonLabel='uusi blogi'>
      <BlogForm 
        handleChange={this.handleLoginChange}
        title={this.state.title}
        author={this.state.author}
        url={this.state.url}
        handleSubmit={this.addBlog}
      />
    </Togglable>

    <h2>blogs</h2>
    {blogsInOrder.map(blog =>
    <Router> 
      <div>
      <Route path="/blogs/:id" render = {({match}) =>
      <Blogir blog = {blogById(match.params.id)} />}
      /> 
      <Link to={`/blogs/${blog._id}`}>{blog.title}</Link>  

      </div>
      </Router>
    )}
    </div>
    )
    

    if (this.state.user === null) {
      return (
        <div>
          <Notification notification={this.state.notification} />
          <h2>Kirjaudu sovellukseen</h2>
          <form onSubmit={this.login}>
            <div>
              käyttäjätunnus
              <input
                type="text"
                name="username"
                value={this.state.username}
                onChange={this.handleLoginChange}
              />
            </div>
            <div>
              salasana
              <input
                type="password"
                name="password"
                value={this.state.password}
                onChange={this.handleLoginChange}
              />
            </div>
            <button type="submit">kirjaudu</button>
          </form>
        </div>
      )
    }

    const byLikes = (b1, b2) => b2.likes - b1.likes

    const blogsInOrder = this.state.blogs.sort(byLikes)

    return (
      <div>
      <div>
        <Router>
          <div>
            <div>
              <Link to="/users">Users   </Link>
              <Link to="/blogs">Blogs</Link>
            </div>
            <Route path="/users" render={() => <Users />} />
            <Route path="/blogs" render={() => <Blogs />} />
            <Route path="/users/:id" render={({match}) =>
            <User user={userById(match.params.id)} />}
          />
          </div>
        </Router>
      </div>




        <Notification notification={this.state.notification} />

        {this.state.user.name} logged in <button onClick={this.logout}>logout</button>


      </div>
    )
  }
}

export default App;
