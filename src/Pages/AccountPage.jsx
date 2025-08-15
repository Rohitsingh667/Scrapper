import { useState, useEffect, useContext } from 'react'
import { AuthContext, FirebaseContext } from '../Store/FirebaseContext'
import Navbar from '../Components/Navbar/Navbar'
import Footer from '../Components/Footer/Footer'
import { useNavigate } from 'react-router-dom'
import './AccountPage.css'
import { EmailAuthProvider } from 'firebase/auth'

function AccountPage() {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const { firebase } = useContext(FirebaseContext)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  
  const [userProfile, setUserProfile] = useState(null)
  const [userProducts, setUserProducts] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: '',
    mobile: '',
    location: '',
    bio: ''
  })
  const [purchasedProducts, setPurchasedProducts] = useState([])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchUserProfile = async () => {
      const userDoc = await firebase.firestore().collection('users').doc(user.uid).get()
      if (userDoc.exists) {
        const userData = userDoc.data()
        setUserProfile(userData)
        setProfileData({
          displayName: userData.username || user.displayName,
          mobile: userData.mobile || '',
          location: userData.location || '',
          bio: userData.bio || ''
        })
      }
    }

    const fetchUserProducts = async () => {
      const snapshot = await firebase.firestore()
        .collection('products')
        .where('userId', '==', user.uid)
        .get()
      setUserProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    }
const fetchPurchasedProducts = async () => {
  const snapshot = await firebase.firestore()
    .collection('products')
    .where('buyerId', '==', user.uid)
    .where('status', '==', 'sold')
    .get();

  const productsWithSellerInfo = await Promise.all(snapshot.docs.map(async doc => {
    const productData = doc.data();
    const sellerDoc = await firebase.firestore().collection('users').doc(productData.userId).get();
    const sellerData = sellerDoc.data();
    const sellerName = sellerData.username || sellerData.name || sellerData.displayName || 'Unknown Seller';
    return {
      id: doc.id,
      ...productData,
      sellerName,
      buyerHasRated: productData.buyerHasRated || false
    };
  }));

  setPurchasedProducts(productsWithSellerInfo);
  };

    fetchUserProfile()
    fetchUserProducts()
    fetchPurchasedProducts()
  }, [user, firebase, navigate])

  const handleRateSeller = async (productId, sellerId, ratingValue) => {
    try {
      const sellerRef = firebase.firestore().collection('users').doc(sellerId)
      const sellerDoc = await sellerRef.get()
      const sellerData = sellerDoc.data()

      const oldRating = sellerData.rating || 0
      const ratingCount = sellerData.ratingCount || 0
      const newRatingCount = ratingCount + 1
      const newRating = ((oldRating * ratingCount) + ratingValue) / newRatingCount

      await sellerRef.update({
        avgRating: newRating,
        totalRatings: newRatingCount
      });
      await firebase.firestore().collection('products').doc(productId).update({
        buyerHasRated: true
      })
      setPurchasedProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, buyerHasRated: true } : p
      ))
    } catch (error) {
      console.error("Rating error:", error)
    }
  }

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      
      const storageRef = firebase.storage().ref(`profilePictures/${user.uid}`)
      const uploadTask = await storageRef.put(file)
      const downloadURL = await uploadTask.ref.getDownloadURL()

      
      await firebase.firestore()
        .collection('users')
        .doc(user.uid)
        .update({ profilePicture: downloadURL })

      setUserProfile(prev => ({ ...prev, profilePicture: downloadURL }))
    } catch (error) {
      console.error("Profile image upload error:", error)
    }
  }
  const handleProfileUpdate = async () => {
    try {
      await firebase.firestore()
        .collection('users')
        .doc(user.uid)
        .update({
          username: profileData.displayName,
          mobile: profileData.mobile,
          location: profileData.location,
          bio: profileData.bio
        })

      setUserProfile(prev => ({ ...prev, ...profileData }))
      setEditMode(false)
    } catch (error) {
      console.error("Error updating profile:", error)
    }
  }
  const handleRemoveListing = async (productId) => {
    try {
      await firebase.firestore().collection('products').doc(productId).delete()
      setUserProducts(prev => prev.filter(p => p.id !== productId))
    } catch (error) {
      console.error("Error removing listing:", error)
    }
  }

const handleDeleteAccount = async () => {
  if (!window.confirm("Are you sure you want to delete your account permanently? This cannot be undone.")) {
    return
  }
  setShowPasswordPrompt(true)
}

const confirmDeleteWithPassword = async () => {
  try {
    const credential = EmailAuthProvider.credential(
      user.email,
      passwordInput
    )
    await user.reauthenticateWithCredential(credential)

    await firebase.firestore().collection('users').doc(user.uid).delete()

    const productsSnapshot = await firebase.firestore()
      .collection('products')
      .where('userId', '==', user.uid)
      .get()

    const batch = firebase.firestore().batch()
    productsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })
    await batch.commit()

    await user.delete()

    navigate('/olx-clone')
  } catch (error) {
    console.error("Error during account deletion:", error)
    alert("Failed to delete account: " + error.message)
  }
}


  return (


    <div className="account-page">
      <Navbar />
      <div className="account-container">
        <div className="profile-card">
          <div className="profile-header">
            <input 
              type="file" 
              id="profilePicture" 
              accept="image/*"
              className="hidden-input" 
              onChange={handleProfileImageUpload}
            />
            <label 
              htmlFor="profilePicture" 
              className="profile-picture-wrapper"
            >
              <img 
                src={userProfile?.profilePicture || require('../Components/PostView/avatar.png')} 
                alt="Profile" 
                className="profile-picture"
              />
              <div className="profile-picture-overlay">
                <span>Change Photo</span>
              </div>
            </label>

            <div className="profile-content">
              {!editMode ? (
                <div className="profile-view">
                  <h2 className="profile-name">{userProfile?.username}</h2>
                  <p className="profile-detail">{userProfile?.mobile}</p>
                  <p className="profile-detail">{userProfile?.location}</p>
                  <p className="profile-bio">{userProfile?.bio}</p>
                  
                  <button 
                    onClick={() => setEditMode(true)}
                    className="btn btn-primary"
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                <div className="profile-edit">
                  <input 
                    type="text" 
                    placeholder="Display Name"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev, 
                      displayName: e.target.value
                    }))}
                    className="input-field"
                  />
                  <input 
                    type="text" 
                    placeholder="Mobile Number"
                    value={profileData.mobile}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev, 
                      mobile: e.target.value
                    }))}
                    className="input-field"
                  />
                  <input 
                    type="text" 
                    placeholder="Location"
                    value={profileData.location}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev, 
                      location: e.target.value
                    }))}
                    className="input-field"
                  />
                  <textarea 
                    placeholder="Bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev, 
                      bio: e.target.value
                    }))}
                    className="input-field textarea"
                    rows="4"
                  />
                  
                  <div className="edit-actions">
                    <button 
                      onClick={handleProfileUpdate}
                      className="btn btn-success"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setEditMode(false)}
                      className="btn btn-danger"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <button 
          onClick={handleDeleteAccount}
          className="btn btn-danger"
        >
          Delete Account
        </button>

        <div className="listings-section">
          <h2 className="listings-title">My Listings</h2>
          {userProducts.length === 0 ? (
            <p className="no-listings">You have no active listings</p>
          ) : (
            <div className="listings-grid">
              {userProducts.map(product => (
                <div key={product.id} className="listing-card">
                  <img 
                    src={product.url} 
                    alt={product.proName} 
                    className="listing-image"
                  />
                  <div className="listing-details">
                    <h3 className="listing-name">{product.proName}</h3>
                    <p className="listing-price">₹{product.price}</p>
                    <button 
                      onClick={() => handleRemoveListing(product.id)}
                      className="btn btn-remove"
                    >
                      Remove Listing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="purchased-section">
          <h2 className="listings-title">My Purchases</h2>
          {purchasedProducts.length === 0 ? (
            <p className="no-listings">You haven’t purchased any products yet.</p>
          ) : (
            <div className="listings-grid">
              {purchasedProducts.map(product => (
                <div key={product.id} className="listing-card">
                  <img src={product.url} alt={product.proName} className="listing-image" />
                  <div className="listing-details">
                    <h3 className="listing-name">{product.proName}</h3>
                    <p className="listing-price">₹{product.price}</p>
                    <p className="listing-price">Seller: {product.sellerName || product.userName}</p>

                    {!product.buyerHasRated ? (
                      <div className="rating-section">
                        <p>Rate the seller:</p>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => handleRateSeller(product.id, product.userId, star)}
                            className="rating-star"
                          >
                            ⭐
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="rated-msg">You rated this seller</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
          {showPasswordPrompt && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Confirm Password</h3>
                <p>Please enter your password to permanently delete your account.</p>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field"
                />
                <div className="modal-actions">
                  <button onClick={confirmDeleteWithPassword} className="btn btn-danger">Confirm Delete</button>
                  <button onClick={() => setShowPasswordPrompt(false)} className="btn btn-secondary">Cancel</button>
                </div>
              </div>
            </div>
          )}
      <Footer />
    </div>
  )
}

export default AccountPage