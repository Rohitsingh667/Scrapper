import React, { useEffect, useContext } from 'react'
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './Pages/Home';
import Signup from './Pages/SignUpPage';
import Login from './Pages/LoginPage';
import { AuthContext, FirebaseContext } from './Store/FirebaseContext'
import Sell from './Components/Sell/Sell';
import PostView from './Pages/PostViewPage';
import Post from './Store/PostContext'
import Loading from './Store/LoadingContext'
import AccountPage from './Pages/AccountPage';

function App() {
  const { user, setUser } = useContext(AuthContext)
  const { firebase } = useContext(FirebaseContext)

  useEffect(() => {
        const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
            setUser (user);
        });
        return () => unsubscribe();
    }, [firebase, setUser ]);
  return (
    <Loading>
      <div className="App">
    
        <Post>
          <Router>
            <Routes>
              <Route exact path="/olx-clone" element={<Home />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/sell" element={<Sell />} />
              <Route path="/post/:id" element={<PostView />} />
              <Route path="/account" element={<AccountPage />} />
            </Routes>
          </Router>
        </Post>
      </div>
      </Loading>
      );
}

      export default App;
