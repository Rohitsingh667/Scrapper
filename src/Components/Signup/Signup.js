import React, { useState, useContext } from 'react'
import { FirebaseContext } from '../../Store/FirebaseContext'
import {useNavigate ,Link} from 'react-router-dom'
import './Signup.css'
import ScrapperLogo from '../assets/ScrapperLogo.js';
import { createUserProfile } from '../../Firebase/config';

function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mobile, setMobile] = useState('')
  const { firebase } = useContext(FirebaseContext)
  const [upi, setUpi] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
      await result.user.updateProfile({ displayName: username });
      try {
        await createUserProfile(result.user, {
          mobile,
          upi,
        });
        
      } catch (err) {
        console.error('Error creating fund account', err);
      }

      navigate('/olx-clone');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className='sign-up'>
      <div className="wrapper">
        <div className="box">
          <div className='top'>
            <ScrapperLogo width="100px" height="100px" />
            <h3>Enter your details</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="details">
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} name="name" placeholder='Full Name' />
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} name='email' placeholder='Email' />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} name='password' placeholder='Password' />
              <input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} name='mobile' placeholder='Mobile' />
              <input type="text" value={upi} onChange={(e) => setUpi(e.target.value)} placeholder='UPI ID' required />          
            </div>
            <div className="button">
              <button  >SIGN IN</button>
              <Link to="/login">  <button style={{background:"white" , color:'black'}}>Already have an Account?</button></Link>
            </div>
          </form>
          <div className="footer">
            <p>All your personal details are safe with us.</p>

            <p>If you continue, you are accepting <br /> OLX Terms and Conditions and Privacy Policy</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login