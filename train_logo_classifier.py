import os
import cv2
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.ensemble import RandomForestClassifier
import joblib

image_model = tf.keras.applications.MobileNetV2(weights='imagenet', include_top=False, pooling='avg')

def extract_features(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return None
    img = cv2.resize(img, (224, 224))
    img = tf.keras.applications.mobilenet_v2.preprocess_input(img.astype(np.float32))
    img = np.expand_dims(img, axis=0)
    features = image_model.predict(img)
    return features[0]

df = pd.read_csv('dataset/file_mapping.csv')
df['Label'] = df['Label'].map({'Genuine': 1, 'Fake': 0})

X, y = [], []
for idx, row in df.iterrows():
    feature = extract_features(os.path.join('dataset', row['Filename']))
    if feature is not None:
        X.append(feature)
        y.append(row['Label'])

X = np.array(X)
y = np.array(y)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

joblib.dump(model, 'logo_classifier.pkl')
print("Logo classifier trained and saved.")
