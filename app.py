import os
import json
import cv2
import base64
import numpy as np
import pandas as pd
import joblib
import logging
import tensorflow as tf

from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)
with open('visual_data.json', 'r') as f:
    stored_visual_data = json.load(f)
image_model = tf.keras.applications.MobileNetV2(weights='imagenet', include_top=False, pooling='avg')

logo_classifier = joblib.load('logo_classifier.pkl')

def extract_features(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img = cv2.resize(img, (224, 224))
    img = tf.keras.applications.mobilenet_v2.preprocess_input(img.astype(np.float32))
    img = np.expand_dims(img, axis=0)
    features = image_model.predict(img)
    return features[0]


@app.route('/extract-features', methods=['POST'])
def extract_features_api():
    image = request.files.get('image')
    if not image:
        return jsonify({'error': 'No image provided'}), 400

    features = extract_features(image.read())
    return jsonify({'feature_vector': features.tolist()})

@app.route('/visual-search', methods=['POST'])
def visual_search():
    image = request.files.get('image')
    if not image:
        return jsonify({'error': 'No image provided'}), 400

    uploaded_feature = extract_features(image.read())

    similarities = []
    for item in stored_visual_data:
        vector = item['featureVector']
        product_id = item['id']
        if product_id:
            sim = cosine_similarity([uploaded_feature], [vector])[0][0]
            similarities.append((sim, product_id))

    similarities.sort(reverse=True, key=lambda x: x[0])
    top_ids = [item[1] for item in similarities[:5]]
    return jsonify({'results': top_ids})

@app.route('/verify-logo', methods=['POST'])
def verify_logo():
    image = request.files.get('image')
    if not image:
        return jsonify({'error': 'No image provided'}), 400

    features = extract_features(image.read())
    if features is None:
        return jsonify({'error': 'Could not extract features'}), 500

    prediction = logo_classifier.predict([features])[0]
    return jsonify({'genuine': bool(prediction)})

def preprocess_data(dataset_path):
    dataset = pd.read_csv(dataset_path)
    dataset['price'] = dataset['price'].replace('[^0-9.]', '', regex=True).astype(float)
    dataset = dataset[(dataset['price'] > 0) & (dataset['price'] <= 200000)]
    dataset = dataset.dropna(subset=['price', 'title', 'categoryName', 'brand', 'description'])
    dataset['product_info'] = (
        dataset['title'] + ' ' +
        dataset['categoryName'] + ' ' +
        dataset['brand'] + ' ' +
        dataset['condition'].astype(str) + ' ' +
        dataset['description']
    )
    dataset.reset_index(drop=True, inplace=True)
    return dataset

dataset_path = 'dataset.csv'
df = preprocess_data(dataset_path)

if not os.path.exists('price_model.pkl'):
    logging.info("Training price prediction model...")
    vectorizer = TfidfVectorizer(max_features=5000)
    X = vectorizer.fit_transform(df['product_info'])
    y = df['price']
    price_model = RandomForestRegressor(n_estimators=100, random_state=42)
    price_model.fit(X, y)
    joblib.dump(price_model, 'price_model.pkl')
    joblib.dump(vectorizer, 'vectorizer.pkl')
    logging.info("Model trained and saved.")
else:
    logging.info("Loading existing price prediction model...")
    price_model = joblib.load('price_model.pkl')
    vectorizer = joblib.load('vectorizer.pkl')

@app.route('/predict_price', methods=['POST'])
def predict_price():
    data = request.json
    product_info = f"{data['title']} {data['category']} {data['brand']} {data['condition']} {data['description']}"
    X_input = vectorizer.transform([product_info])
    predicted_price = price_model.predict(X_input)[0]
    return jsonify({'predicted_price': round(predicted_price, 2)})

@app.route('/recommend', methods=['POST'])
@cross_origin(origin='http://localhost:3000')
def recommend():
    data = request.json
    history = data.get('history', [])
    unsold_products = data.get('unsoldProducts', [])

    if not history or not unsold_products:
        return jsonify({'recommendations': []})

    def to_text(product):
        return (
            (product.get('category', '').lower().strip() + ' ') * 3 +
            (product.get('brand', '').lower().strip() + ' ') * 2 +
            (product.get('proName', '').lower().strip() + ' ') * 2 +
            (str(product.get('condition', '')).lower().strip() + ' ') +
            product.get('description', '').lower().strip()
        )

    history_texts = [to_text(p) for p in history]
    product_texts = [to_text(p) for p in unsold_products]

    combined_texts = product_texts + history_texts
    tfidf_matrix = vectorizer.transform(combined_texts)

    product_vectors = tfidf_matrix[:len(product_texts)]
    history_vectors = tfidf_matrix[len(product_texts):]

    user_profile = np.asarray(history_vectors.mean(axis=0)).ravel()
    product_vectors = product_vectors.toarray()

    similarities = cosine_similarity([user_profile], product_vectors).flatten()

    history_ids = {item.get('id') for item in history}
    scored_products = [
        (i, similarities[i]) for i in range(len(unsold_products))
        if unsold_products[i].get('id') not in history_ids
    ]

    top_indices = [i for i, _ in sorted(scored_products, key=lambda x: x[1], reverse=True)[:10]]

    recommendations = [unsold_products[i] for i in top_indices]
    logging.info("Recommendations sent to frontend.")
    return jsonify({'recommendations': recommendations})

if __name__ == '__main__':
    app.run(debug=True)
