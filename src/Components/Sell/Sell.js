import React, { useState, useContext , useEffect} from 'react';
import './Sell.css';

import { FirebaseContext, AuthContext } from '../../Store/FirebaseContext';
import { useNavigate } from 'react-router-dom';
import OlxLogo from '../assets/ScrapperLogo';

function Sell() {
    const navigate = useNavigate();
    const { firebase } = useContext(FirebaseContext);
    const { user } = useContext(AuthContext);
    const [proName, setproName] = useState('');
    const [category, setcategory] = useState('');
    const [price, setprice] = useState('');
    const [description, setdescription] = useState('');
    const [yearOfPurchase, setyearOfPurchase] = useState('');
    const [image, setimage] = useState(null);
    const date = new Date();
    const [brand, setBrand] = useState(''); 
    const [condition, setCondition] = useState('');
    const [predictedPrice, setPredictedPrice] = useState(null);

    const fetchPredictedPrice = async () => {
        if (!proName || !category || !brand || !condition || !description) return;
        
        const requestData = {
            title: proName,
            category: category,
            brand: brand,
            condition: condition,
            description: description
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/predict_price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error- Status: ${response.status}`);
            }

            const data = await response.json();
            setPredictedPrice(data.predicted_price);
            
        } catch (error) {
            console.error("Error fetching predicted price:", error);
            setPredictedPrice("Price prediction not available");
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPredictedPrice();
        }, 2000);
        
        return () => clearTimeout(timer);
    }, [proName, category, brand, condition, description]);

const handleSubmit = async () => {
  if (!image) {
    alert("Please upload an image.");
    return;
  }

  const formData = new FormData();
  formData.append("image", image);

  try {
    const verifyRes = await fetch("http://127.0.0.1:5000/verify-logo", {
      method: "POST",
      body: formData
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.genuine) {
      alert("Fake logo detected. Only genuine products can be uploaded.");
      return;
    }

    const featureRes = await fetch("http://127.0.0.1:5000/extract-features", {
      method: "POST",
      body: formData
    });

    if (!featureRes.ok) throw new Error("Feature extraction failed");
    const featureData = await featureRes.json();
    const featureVector = featureData.feature_vector;

    const imageRef = await firebase.storage().ref(`/image/${image.name}`).put(image);
    const url = await imageRef.ref.getDownloadURL();

    const productRef = await firebase.firestore().collection('products').add({
      proName,
      category,
      price,
      description,
      yearOfPurchase,
      url,
      userId: user.uid,
      createdOn: date.toDateString(),
      brand,
      condition,
      status: 'available',
      featureVector
    });

    navigate('/olx-clone');
  } catch (error) {
    console.error("Error uploading product:", error);
  }
};

    return (
        <div className='sell-page'>
            <div className="wrapper">
                <div className="box">
                    <div className='top'>
                        <OlxLogo width="100px" height="100px"></OlxLogo>
                        <h3>Enter Product details</h3>
                    </div>
                    <div className="details">
                        <input type="text" name="name" value={proName} onChange={(e) => setproName(e.target.value)} placeholder='Product Name' />
                        <input type="text" name='brand' value={brand} onChange={(e) => setBrand(e.target.value)} placeholder='Brand' />
                        <br/>
                        <select className='category-dropdown'
                        name='category' value={category} onChange={(e) => setcategory(e.target.value)} placeholder='Category'>
                            <option value="" disabled>Select Category</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Bike">Bike</option>
                            <option value="Car">Car</option>
                            <option value="Book">Book</option>
                            <option value="Furniture">Furniture</option>
                            <option value="House">House</option>
                            <option value="Miscellaneous">Miscellaneous</option>
                        </select>
                        <br/>
                        
                        <select className='condition-dropdown' name='condition' value={condition} onChange={(e) => setCondition(e.target.value)}>
                            <option value="" disabled>Select Condition</option>
                            <option value="New">New</option>
                            <option value="Used">Used</option>
                            <option value="Open Box">Open Box</option>
                        </select>
                        <br/>
                        <input type="text" name='year-of-purchase' value={yearOfPurchase} onChange={(e) => setyearOfPurchase(e.target.value)} placeholder='Year of Purchase' />
                        <textarea type="text" name='description' value={description} onChange={(e) => setdescription(e.target.value)} placeholder='Type something about the product....' />
                        <input type="text" name='price' value={price} onChange={(e) => setprice(e.target.value)} placeholder='Price' />
                        {predictedPrice !== null && (
                            <p className="predicted-price">Predicted Price: ₹{predictedPrice}</p>
                        )}
                        <input type="file" name='mobile' onChange={(e) => { setimage(e.target.files[0]) }} placeholder='Choose A file' />
                    </div>
                    <div className="button">
                        <button onClick={handleSubmit}>Upload</button>
                    </div>
                    <div className="footer">
                        <p>All your personal details are safe with us.</p>
                        <p>If you continue, you are accepting <br /> OLX Terms and Conditions and Privacy Policy</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sell;