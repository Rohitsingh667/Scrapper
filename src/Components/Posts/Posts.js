import React, { useEffect, useState, useContext } from 'react';
import { FirebaseContext } from '../../Store/FirebaseContext';
import { PostContext } from '../../Store/PostContext';
import { useNavigate } from 'react-router-dom';
import { ScrollMenu } from 'react-horizontal-scrolling-menu';
import 'react-horizontal-scrolling-menu/dist/styles.css';
import './Posts.css';

function Posts({ searchQuery, filters, visualResults }) {
    const navigate = useNavigate();
    const { firebase } = useContext(FirebaseContext);
    const [products, setProducts] = useState([]);
    const { setpostDetails } = useContext(PostContext);
    const [recommended, setRecommended] = useState([]);

    const userId = firebase.auth().currentUser?.uid;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const snapshot = await firebase.firestore().collection('products').get();
                const allPost = snapshot.docs.map((product) => ({
                    ...product.data(),
                    id: product.id
                }));
                const unsold = allPost.filter(product => product.status !== 'sold');
                setProducts(unsold);
                let historySnapshot = await firebase.firestore()
                    .collection('users')
                    .doc(userId)
                    .collection('history')
                    .get();

                const history = historySnapshot.docs.map(doc => doc.data());
                const response = await fetch('http://127.0.0.1:5000/recommend', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        history,
                        unsoldProducts: unsold
                    })
                });

                const data = await response.json();
                if (data.recommendations) {
                    setRecommended(data.recommendations);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        if (userId) fetchData();
    }, [firebase, userId]);

    const safeSearchQuery = searchQuery ? searchQuery.toString().toLowerCase() : "";

    const filteredProducts = products.filter(product => {
        
        const normalizedPrice = parseFloat(product.price.replace(/,/g, ''));
    
        const matchesSearch =
            (product.proName && product.proName.toLowerCase().includes(safeSearchQuery)) ||
            (product.yearOfPurchase && product.yearOfPurchase.includes(safeSearchQuery)) ||
            (product.price && product.price.includes(safeSearchQuery));
    
        const matchesFilters =
            (!filters.minPrice || normalizedPrice >= parseFloat(filters.minPrice)) &&
            (!filters.maxPrice || normalizedPrice <= parseFloat(filters.maxPrice)) &&
            (!filters.year || parseInt(product.yearOfPurchase) === parseInt(filters.year)) &&
            (!filters.category || product.category.toLowerCase() === filters.category.toLowerCase());
    
        return matchesSearch && matchesFilters;
    });

    const categorizedProducts = filteredProducts.reduce((acc, product) => {
        const category = product.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(product);
        return acc;
    }, {});

    return (
        <div className='posts'>
            {visualResults.length > 0 && (
                <div className="category-section">
                    <div className="post-header">
                        <h3>Visually Similar Products</h3>
                    </div>
                    <ScrollMenu className="scroll-menu">
                        {visualResults.map(id => {
                        const product = products.find(p => p.id === id);
                        if (!product) return null;

                        return (
                            <div className="product" key={id} onClick={() => {
                                setpostDetails(product);
                                navigate(`/post/${id}`);
                            }}>
                                <div className="top">
                                    <img src={product.url} alt={product.proName} />
                                </div>
                                <div className="bottom">
                                    <h4>₹{product.price}</h4>
                                    <p>{product.yearOfPurchase}</p>
                                    <p style={{ color: '#999999' }}>{product.proName}</p>
                                </div>
                            </div>
                        );
                    })}
                    </ScrollMenu>
                </div>
            )}
            {recommended.length === 0 && (
            <p>No personalized recommendations yet. Start browsing to see suggestions!</p>
            )}
            {recommended.length > 0 && (
                <div className="category-section">
                    <div className="post-header">
                        <h3>Recommended for You</h3>
                    </div>
                    <ScrollMenu className="scroll-menu">
                        {recommended.map(product => (
                            <div className="product" key={product.id} onClick={() => {
                                console.log("Setting postDetails:", product);
                                setpostDetails(product);
                                navigate(`/post/${product.id}`);
                            }}>
                                <div className="top">
                                    <img src={product.url} alt={product.proName} />
                                </div>
                                <div className="bottom">
                                    <h4>₹{product.price}</h4>
                                    <p>{product.yearOfPurchase}</p>
                                    <p style={{ color: '#999999' }}>{product.proName}</p>
                                </div>
                            </div>
                        ))}
                    </ScrollMenu>
                </div>
            )}
            {Object.keys(categorizedProducts).map(category => (
                <div key={category} className="category-section">
                    <div className="post-header">
                        <h3>{category}</h3>
                    </div>
                    <ScrollMenu className="scroll-menu">
                        {categorizedProducts[category].map(product => (
                            <div className="product" key={product.id} onClick={() => {
                                setpostDetails(product);
                                navigate(`/post/${product.id}`);
                            }}>
                                <div className="top">
                                    <img src={product.url} alt={product.proName} />
                                </div>
                                <div className="bottom">
                                    <h4>₹{product.price}</h4>
                                    <p>{product.yearOfPurchase}</p>
                                    <p style={{ color: '#999999' }}>{product.proName}</p>
                                </div>
                            </div>
                        ))}
                    </ScrollMenu>
                </div>
            ))}
        </div>
    );
}

export default Posts;
