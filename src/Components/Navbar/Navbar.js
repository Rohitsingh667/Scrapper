import React, { useState, useContext, useRef } from 'react'
import Arrow from '../assets/Arrow'
import Search from '../assets/Search'
import { useNavigate, Link } from 'react-router-dom'
import SellButton from '../assets/sellButton'
import SellButtonPlus from '../assets/sellPlus'
import { AuthContext, FirebaseContext } from '../../Store/FirebaseContext'
import './Navbar.css'
import ScrapperLogo from '../assets/ScrapperLogo'

function Navbar({ setSearchQuery, setVisualResults }) {
    const navigate = useNavigate()
    const { user } = useContext(AuthContext)
    const { firebase } = useContext(FirebaseContext)
    const [condition, setcondition] = useState(false)
    const [account, setaccount] = useState(false)
    const [bar, setbar] = useState(false)
    const [location, setLocation] = useState("")
    const [search, setSearch] = useState("") 

    function show() {
        setcondition(!condition)
        console.log("Worked")
    }

    const handleVisualSearch = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('http://127.0.0.1:5000/visual-search', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        return;
        }

        const data = await response.json();
        console.log("Visual search result:", data);
        setVisualResults(data.results || []);
        setSearchQuery("");
    } catch (error) {
        console.error("Visual search failed:", error);
    }
};


    function LogOut() {
        firebase.auth().signOut()
        navigate('/login')
    }

    return (
        <div className='navbar'>
            <h2 className='navtitle'>Scrapper</h2>
            
            <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                id="visual-search-upload"
                onChange={handleVisualSearch}
            />
            <label htmlFor="visual-search-upload" className="visual-search-button">
                🔍 Upload Image
            </label>
            <div className='search-bar'>
                <input
                    type="text"
                    placeholder='Find Cars, Mobile Phones, ...'
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setSearchQuery(e.target.value) 
                    }}
                />
                <div className='search-product'>
                    <Search fill="#ffffff" width="25px" />
                </div>
            </div>

            <div className='right'>
                <div className="account">
                    <a onClick={() => setaccount(!account)}>
                    {user ? user.displayName : 'Account'} <Arrow />
                    </a>
                    {account && (
                    <div className={`account-dropdown ${account ? 'show' : ''}`}>
                        {user ? (
                        <>
                            <Link to="/account">My Profile</Link>
                            <a onClick={LogOut}>Logout</a>
                        </>
                        ) : (
                        <Link to="/login">Login</Link>
                        )}
                    </div>
                    )}
                </div>
                <div className='sell-parent' onClick={() => { user ? navigate('/sell') : navigate('/login') }}>
                    <div className='sell'>
                        <div className="sell-title">
                            <SellButtonPlus />
                            <p>SELL</p>
                        </div>
                        <SellButton />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Navbar
