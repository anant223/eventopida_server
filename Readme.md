# Eventopia :- Virtual Event Hub
## Create and join live virtual events effortlessly!
This platform empowers you to organize interactive sessions, workshops, and meetups that participants can join live on the scheduled date. Seamless streaming, real-time chat, and engaging features ensure a vibrant and dynamic event experience. Start creating your next big virtual event today!
- [Model link] (https://github.com/anant223)


## 🚀 Features Implemented
### ✅ User Authentication
* JWT-based authentication with cookie support.

* User registration, login, and profile update.

* Middleware to protect routes and decode JWT.

* ❤️ Like System (with Socket.IO)
* Users can like/unlike events.

* Real-time like updates are emitted using Socket.IO.

* Server broadcasts changes to all connected clients.

* Duplicate likes are prevented using a composite unique index.

### 📦 Event Management
* Events can be created, fetched, updated, and deleted.

* Each event stores metadata like title, description, category, location, etc.

* Event card data is fetched using React Query (on the frontend) for optimized caching and updates.

### 🔗 Socket.IO Integration
* Socket authentication using JWT from cookies.

* like:update events emitted when a user likes/unlikes.

* Other clients receive these updates in real-time and update their UI.

* Follows a clean pub-sub model for scalability.

