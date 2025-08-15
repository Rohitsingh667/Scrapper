import React, { useState, useContext } from 'react'
import { FirebaseContext } from '../../Store/FirebaseContext'
import { useNavigate, Link } from 'react-router-dom'
import './Login.css'
import ScrapperLogo from '../assets/ScrapperLogo';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { firebase } = useContext(FirebaseContext);

    const handleSubmit = (e) => {
        e.preventDefault();
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(() => {
                navigate('/olx-clone');
            })
            .catch((err) => {
                alert(err.message);
            });
    };

    const handleforgot = () => {
        if (!email) {
            alert("Please enter your email to reset the password.");
            return;
        }

        firebase.auth().sendPasswordResetEmail(email)
            .then(() => {
                alert("Password reset email sent! Check your inbox.");
            })
            .catch((err) => {
                alert(err.message);
            });
    };

    return (
        <div className='login'>
            <div className="wrapper">
                <div className="box">
                    <div className='top'>
                        < ScrapperLogo width="100px" height="100px" />
                        <h3>Enter your details</h3>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="details">
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} name='email' placeholder='Email' />
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} name='password' placeholder='Password' />
                        </div>
                        <div className="button">
                            <button type="submit">LOGIN</button>
                            <button type="button" onClick={handleforgot}>Forgot password?</button>
                            <Link to="/signup">
                                <button style={{ background: "white", color: 'black' }}>SIGN UP</button>
                            </Link>
                        </div>
                    </form>
                    <div className="footer">
                        <p>All your personal details are safe with us.</p>
                        <p>If you continue, you are accepting <br /> OLX Terms and Conditions and Privacy Policy</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
