import React, { useEffect, useState, useContext } from 'react';
import { FirebaseContext } from '../../Store/FirebaseContext';
import './Chat.css';

function ChatPage() {
    const { firebase } = useContext(FirebaseContext);
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        const fetchConversations = async () => {
            const userId = firebase.auth().currentUser .uid;
            const snapshot = await firebase.firestore().collection('chats').where('senderId', '==', userId).get();
            const userConversations = snapshot.docs.map(doc => doc.data());
            setConversations(userConversations);
        };
        fetchConversations();
    }, [firebase]);

    const handleSelectChat = async (chat) => {
        setSelectedChat(chat);
        // Fetch messages for the selected chat
        const messagesSnapshot = await firebase.firestore().collection('chats').where('receiverId', '==', chat.receiverId).get();
        const chatMessages = messagesSnapshot.docs.map(doc => doc.data());
        setMessages(chatMessages);
    };

    const handleSendMessage = async () => {
        if (!newMessage) return;

        const chatData = {
            senderId: firebase.auth().currentUser .uid,
            receiverId: selectedChat.receiverId,
            message: newMessage,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        };

        await firebase.firestore().collection('chats').add(chatData);
        setNewMessage('');
        // Optionally, fetch messages after sending
    };

    return (
        <div className="chat-page">
            <div className="conversations">
                {conversations.map(chat => (
                    <div key={chat.receiverId} onClick={() => handleSelectChat(chat)}>
                        {chat.receiverId}
                    </div>
                ))}
            </div>
            <div className="chat-window">
                {selectedChat && (
                    <>
                        <div className="messages">
                            {messages.map((msg, index) => (
                                <div key={index}>{msg.message}</div>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button onClick={handleSendMessage}>Send</button>
                    </>
                )}
            </div>
        </div>
    );
}

export default ChatPage;