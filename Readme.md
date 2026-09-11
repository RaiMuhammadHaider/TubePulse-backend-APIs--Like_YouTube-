# StreamForge API — YouTube Clone Backend

A production-minded REST API for a video-sharing platform inspired by YouTube. StreamForge API provides the backend building blocks for account management, secure authentication, video publishing, audience engagement, comments, subscriptions, playlists, and watch history.

Built to serve a web or mobile client, the service uses JWT-protected routes, MongoDB document models, Cloudinary media hosting, and a clean controller-based structure.

> **Author credit:** All controllers and the core application logic in this project were written entirely by **Rai Muhammad Haider**.

## Built With

| Technology | Purpose |
| --- | --- |
| [Node.js](https://nodejs.org/) | JavaScript runtime |
| [Express](https://expressjs.com/) | REST API framework |
| [MongoDB](https://www.mongodb.com/) | Document database |
| [Mongoose](https://mongoosejs.com/) | MongoDB object modelling |
| [JSON Web Tokens](https://jwt.io/) | Access and refresh token authentication |
| [Cloudinary](https://cloudinary.com/) | Video, thumbnail, avatar, and cover-image storage |
| [Multer](https://github.com/expressjs/multer) | Multipart file-upload handling |

## Architecture & Methodology

The application follows an MVC-inspired, feature-oriented architecture:

```
Routes → Middleware → Controllers → Mongoose Models → MongoDB
                 ↘ Cloudinary (media assets)
```

- **RESTful routes** keep resources and HTTP verbs predictable.
- **Controllers** contain the business logic and return consistent API responses.
- **Mongoose schemas** model users, videos, comments, likes, subscriptions, playlists, and tweets with document references between them.
- **JWT middleware** protects authenticated resources and attaches the current user to each request.
- **Multer + Cloudinary** handle multipart uploads and media persistence outside the application server.
- **Async error handling** centralizes failures so clients receive JSON-safe errors.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A MongoDB database (local installation or MongoDB Atlas)
- A Cloudinary account for uploads

### Installation

1. Clone the repository and enter it.

   ```bash
   git clone https://github.com/RaiMuhammadHaider/BackEnd-with-Javascript-Notes.git
   cd BackEnd-with-Javascript-Notes
   ```

2. Install dependencies.

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root. Do not commit this file.

   ```env
   PORT=9000
   MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>/?retryWrites=true&w=majority
   CORS_ORIGIN=http://localhost:3000

   ACCESS_TOKEN_SECRET=replace_with_a_long_random_secret
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_SECRET=replace_with_a_different_long_random_secret
   REFRESH_TOKEN_EXPIRY=10d

   CLOUDINARY_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

   The app connects to the `youtube_Clone` database name automatically. `CLOUDINARY_API_SECRECT` is also accepted for backwards compatibility with an earlier spelling.

4. Start the development server.

   ```bash
   npm run dev
   ```

   The API is available at `http://localhost:9000` by default, with routes under `/api/v1`.

## How to Use

1. Register an account through the registration endpoint. Submit `multipart/form-data` when including an `avatar` or `coverImage`.
2. Log in to receive authentication cookies/tokens.
3. Send authenticated requests with an `Authorization: Bearer <access-token>` header (or allow cookies from the configured CORS origin).
4. Upload a video as `multipart/form-data`, using `videoFile` and `thumbnail` fields.
5. Use the returned video IDs to retrieve content, comment, like, or manage subscriptions.

Example authenticated request:

```bash
curl http://localhost:9000/api/v1/user/getCurrentUser \
  -H "Authorization: Bearer <access-token>"
```

## API Reference

All routes below are prefixed with `http://localhost:9000/api/v1`. Routes marked **Auth** require a valid JWT.

### Authentication & Profiles

| Method | Route | Auth | Description |
| --- | --- | :---: | --- |
| `POST` | `/user/register` | — | Create an account; accepts optional `avatar` and `coverImage` uploads. |
| `POST` | `/user/login` | — | Authenticate a user and issue access/refresh credentials. |
| `POST` | `/user/logout` | Yes | End the current session. |
| `POST` | `/user/refresh-token` | Yes | Refresh the current access token. |
| `GET` | `/user/getCurrentUser` | Yes | Get the signed-in user's profile. |
| `PATCH` | `/user/changePassword` | Yes | Change the signed-in user's password. |
| `PATCH` | `/user/updateAccount` | Yes | Update account details. |
| `PATCH` | `/user/updateAvatar` | Yes | Replace the avatar (`avatar` multipart field). |
| `PATCH` | `/user/updateCoverImage` | Yes | Replace the cover image (`coverImage` multipart field). |
| `GET` | `/user/c/:username` | Yes | Get a channel profile by username. |
| `GET` | `/user/watchHistory` | Yes | Get the signed-in user's watch history. |

### Videos

| Method | Route | Auth | Description |
| --- | --- | :---: | --- |
| `GET` | `/video` | Yes | List videos, with supported query filtering/pagination. |
| `POST` | `/video` | Yes | Publish a video; accepts `videoFile` and `thumbnail` multipart fields. |
| `GET` | `/video/:videoId` | Yes | Retrieve one video by ID with its channel-owner details. |
| `PUT` | `/video/:videoId` | Yes | Update video metadata or uploaded media. |
| `DELETE` | `/video/:videoId` | Yes | Delete a video. |
| `PATCH` | `/video/:videoId/publish` | Yes | Toggle a video's published state. |

### Engagement & Comments

| Method | Route | Auth | Description |
| --- | --- | :---: | --- |
| `POST` | `/like/toggle/v/:videoId` | Yes | Toggle the current user's like on a video. |
| `GET` | `/like/videos` | Yes | List videos liked by the signed-in user. |
| `POST` | `/like/toggle/c/:commentId` | Yes | Toggle a like on a comment. |
| `POST` | `/like/toggle/t/:tweetId` | Yes | Toggle a like on a tweet. |
| `POST` | `/comment/:videoId` | Yes | Add a comment to a video. |
| `GET` | `/comment/:videoId` | Yes | Fetch comments for a video. |
| `PUT` | `/comment/:commentId` | Yes | Update a comment. |
| `DELETE` | `/comment/:commentId` | Yes | Delete a comment. |

> **Dislikes:** A standalone dislike route is not currently implemented. A suitable next endpoint is `POST /like/toggle-dislike/v/:videoId`, backed by a reaction type or dedicated dislike model.

### Subscriptions & Playlists

| Method | Route | Auth | Description |
| --- | --- | :---: | --- |
| `POST` | `/subscription/c/:id` | Yes | Subscribe to or unsubscribe from a channel. |
| `GET` | `/subscription/c/:id` | Yes | Get channels subscribed to by a user. |
| `GET` | `/subscription/c/:id/subscribers` | Yes | Get subscribers for a channel. |
| `POST` | `/playlist` | Yes | Create a playlist. |
| `GET` | `/playlist/user/:userId` | Yes | Get a user's playlists. |
| `POST` | `/playlist/add/:videoId/:playlistId` | Yes | Add a video to a playlist. |
| `DELETE` | `/playlist/add/:videoId/:playlistId` | Yes | Remove a video from a playlist. |

## Future Enhancements

- [ ] Implement dislike reactions and a public-video browsing policy.
- [ ] Add request validation, rate limiting, and security headers.
- [ ] Generate video transcodes and adaptive streaming manifests asynchronously.
- [ ] Add full-text search, recommendations, and notification workflows.
- [ ] Publish OpenAPI/Swagger documentation and automated integration tests.
- [ ] Add observability: structured logs, metrics, health checks, and error tracking.
- [ ] Containerize the service and configure CI/CD for reliable deployments.

## Author & Contact

Created and maintained by **Rai Muhammad Haider**.

| Platform | Link |
| --- | --- |
| Portfolio | [raimhaider.vercel.app](https://raimhaider.vercel.app/) |
| GitHub | [@RaiMuhammadHaider](https://github.com/RaiMuhammadHaider) |
| Facebook | [alihaiderrsharif](https://www.facebook.com/alihaiderrsharif/) |
| X | [@RaiMHaider](https://x.com/RaiMHaider) |
| LinkedIn | [Rai Muhammad Haider](https://www.linkedin.com/in/raimuahmmadhaider) |

---

If this project helps you, consider starring the repository on GitHub.
