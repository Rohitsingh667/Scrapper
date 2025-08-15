import { useContext, useState, useEffect } from 'react';
import { FirebaseContext } from '../../Store/FirebaseContext';
import './PostView.css';
import Rating from '@mui/material/Rating';
import { useParams } from 'react-router-dom';

function PostView() {
  const { firebase } = useContext(FirebaseContext);
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [seller, setSeller] = useState(null);
  const [isSold, setIsSold] = useState(false);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      if (id) {
        const doc = await firebase.firestore().collection('products').doc(id).get();
        if (doc.exists) {
          const data = { ...doc.data(), id: doc.id };
          setPost(data);
        } else {
          console.warn('Product not found');
        }
      }
    };
    fetchPost();
  }, [firebase, id]);

  useEffect(() => {
    const fetchSeller = async () => {
      if (post?.userId) {
        const doc = await firebase.firestore().collection('users').doc(post.userId).get();
        if (doc.exists) {
          setSeller(doc.data());
          setUserDetails(doc.data());
        }
      }
    };
    fetchSeller();
  }, [post]);

  useEffect(() => {
    if (!post) return;
    window.scrollTo(0, 0);

    const productRef = firebase.firestore().collection('products').doc(post.id);
    const unsubscribe = productRef.onSnapshot((doc) => {
      const updatedData = doc.data();
      setIsSold(updatedData.status === 'sold');
      const currentUserId = firebase.auth().currentUser?.uid;
      if (
        updatedData.status === 'sold' &&
        updatedData.buyerId === currentUserId &&
        updatedData.buyerHasRated === false
      ) {
        setShowRatingPrompt(true);
      }
    });

    return () => unsubscribe();
  }, [firebase, post]);

  useEffect(() => {
    const userId = firebase.auth().currentUser?.uid;
    if (userId && post?.id) {
      firebase
        .firestore()
        .collection('users')
        .doc(userId)
        .collection('history')
        .doc(post.id)
        .set({ ...post, viewedAt: new Date() });
    }
  }, [firebase, post]);

  const handlePayment = async () => {
    const res = await fetch('http://localhost:5000/api/create-payment-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: post.price * 100,
        name: 'Buyer',
        description: post.proName,
        phone: userDetails?.mobile,
      }),
    });

    const data = await res.json();
    if (data.success) {
      const productRef = firebase.firestore().collection('products').doc(post.id);
      await productRef.update({ cashfree_payment_id: data.paymentId });
      window.open(data.paymentLink, '_blank');
    } else {
      alert('Failed to create payment link: ' + data.message);
    }
  };

  const handleVerifyPayment = async () => {
    const productRef = firebase.firestore().collection('products').doc(post.id);
    const doc = await productRef.get();
    const data = doc.data();

    if (!data.cashfree_payment_id) return alert('No payment ID found.');

    const verifyRes = await fetch('http://localhost:5000/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: data.cashfree_payment_id }),
    });

    const verifyData = await verifyRes.json();
    if (verifyData.success) {
      const payoutRes = await fetch('http://localhost:5000/api/initiate-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upi: userDetails?.upi,
          amount: post.price * 100,
        }),
      });

      const payoutData = await payoutRes.json();
      if (payoutData.success) {
        await productRef.update({
          status: 'sold',
          buyerId: firebase.auth().currentUser.uid,
          buyerHasRated: false,
        });

        alert('✅ Payment verified and seller paid.');
        setIsSold(true);
        setShowRatingPrompt(true);
      } else {
        alert('❌ Failed to send payout.');
      }
    } else {
      alert('❌ Payment not verified.');
    }
  };

  const submitRating = async () => {
    const currentUser = firebase.auth().currentUser;
    if (!ratingValue || !currentUser) return;

    await firebase.firestore().collection('ratings').add({
      sellerId: post.userId,
      buyerId: currentUser.uid,
      productId: post.id,
      rating: ratingValue,
      timestamp: new Date(),
    });

    await firebase.firestore().collection('products').doc(post.id).update({
      buyerHasRated: true,
    });

    updateSellerAverageRating(post.userId);
    setShowRatingPrompt(false);
  };

  const updateSellerAverageRating = async (sellerId) => {
    const snapshot = await firebase
      .firestore()
      .collection('ratings')
      .where('sellerId', '==', sellerId)
      .get();

    const ratings = snapshot.docs.map((doc) => doc.data().rating);
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;

    await firebase.firestore().collection('users').doc(sellerId).update({
      avgRating: avg,
      totalRatings: ratings.length,
    });

    setSeller((prev) => ({ ...prev, avgRating: avg, totalRatings: ratings.length }));
  };

  if (!post) return <p>Loading...</p>;

  return (
    <div className="post-view">
      <div className="column-1">
        <div className="images">
          <img src={post.url} alt={post.proName} />
        </div>
        <div className="mobile-price">
          <div className="top">
            <h2>₹ {post.price}</h2>
            <div className="icon">
              <i className="fa-solid fa-share-nodes"></i>
              <i className="fa-regular fa-heart"></i>
            </div>
          </div>
          <p>{post.proName}</p>
          <div className="bottom">
            {seller && (
              <div>
                <p>Seller: {seller.username || seller.displayName || 'Unknown Seller'}</p>
                {seller.avgRating !== undefined && (
                  <p>Rating: ⭐ {seller.avgRating.toFixed(1)} ({seller.totalRatings || 0})</p>
                )}
              </div>
            )}
            <p>Today</p>
          </div>
        </div>
        <div className="content">
          <h4>Description</h4>
          <p>{post.description}</p>
        </div>
      </div>

      <div className="column-2">
        <div className="box-1">
          <div className="top">
            <h2>₹ {post.price}</h2>
            <div className="icon">
              <i className="fa-solid fa-share-nodes"></i>
              <i className="fa-regular fa-heart"></i>
            </div>
          </div>
          <p className="proname">{post.proName}</p>
          <div className="bottom">
            {seller && (
              <div>
                <p>Seller: {seller.username || seller.displayName || 'Unknown Seller'}</p>
                {seller.avgRating !== undefined && (
                  <p>Rating: ⭐ {seller.avgRating.toFixed(1)} ({seller.totalRatings || 0})</p>
                )}
              </div>
            )}
            <p>Today</p>
          </div>
        </div>
        <div className="box-2">
          <div className="top">
            <h4>Seller description</h4>
          </div>
          {userDetails && (
            <div className="profile">
              <img src={require('./avatar.png')} alt="" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3>{userDetails.displayName}</h3>
                <p>{userDetails.mobile}</p>
              </div>
            </div>
          )}
          <div className="chat">
            {firebase.auth().currentUser?.uid !== post.userId && !isSold && (
              <button onClick={handlePayment}>Buy Now</button>
            )}
            {post.cashfree_payment_id && !isSold && (
              <button onClick={handleVerifyPayment} style={{ marginTop: '10px' }}>
                Verify Payment
              </button>
            )}
            {isSold && <p style={{ color: 'green' }}>Product has been sold.</p>}
          </div>
        </div>
      </div>

      {showRatingPrompt && (
        <div className="rating-modal">
          <h3>Rate the Seller</h3>
          <Rating
            name="seller-rating"
            value={ratingValue}
            onChange={(event, newValue) => setRatingValue(newValue)}
          />
          <div>
            <button onClick={submitRating}>Submit</button>
            <button onClick={() => setShowRatingPrompt(false)}>Rate Later</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostView;
