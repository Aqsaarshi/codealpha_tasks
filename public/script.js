const API =
  location.hostname === "localhost"
    ? "http://localhost:3000/posts"
    : "https://codealphatasks-production-2545.up.railway.app/posts";

let visiblePosts = 3;

const nameInput = document.getElementById("name");
const messageInput = document.getElementById("message");
const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const charCount = document.getElementById("charCount");
const searchInput = document.getElementById("search");
const submitBtn = document.getElementById("submitBtn");

let editId = null;

nameInput.value = localStorage.getItem("username") || "";

// Character counter
messageInput.addEventListener("input", () => {
  charCount.textContent = `${messageInput.value.length} / 200`;
});

// Image preview
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
});

// Load More button
document.getElementById("loadMore").addEventListener("click", () => {
  visiblePosts += 3;
  loadPosts();
});

// Submit new post
submitBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  const image = preview.src;

  if (!name || !message) return alert("Please fill all fields");

  const post = {
    name,
    message,
    image: image || "",
    timestamp: new Date().toISOString(),
    likes: 0,
    comments: [],
  };

  localStorage.setItem("username", name);

  const method = editId ? "PATCH" : "POST";
  const url = editId ? `${API}/${editId}` : API;

  fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  }).then(() => {
    messageInput.value = "";
    preview.src = "";
    preview.style.display = "none";
    imageInput.value = "";
    charCount.textContent = "0 / 200";
    submitBtn.textContent = "Post";
    editId = null;
    loadPosts();
  });
});

window.likePost = function (id, currentLikes) {
  fetch(`${API}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ likes: (currentLikes || 0) + 1 }),
  }).then(loadPosts);
};

window.deletePost = function (id) {
  if (confirm("Are you sure you want to delete this post?")) {
    fetch(`${API}/${id}`, { method: "DELETE" }).then(loadPosts);
  }
};

window.editPost = function (id, message) {
  messageInput.value = message;
  submitBtn.textContent = "Update Post";
  editId = id;
};

function timeAgo(timestamp) {
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute(s) ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour(s) ago`;
  const days = Math.floor(hours / 24);
  return `${days} day(s) ago`;
}

function loadPosts() {
  fetch(API)
    .then((res) => res.json())
    .then((posts) => {
      const feed = document.getElementById("feed");
      const filtered = searchInput.value
        ? posts.filter((p) =>
            p.name.toLowerCase().includes(searchInput.value.toLowerCase())
          )
        : posts;

      feed.innerHTML = "";
      filtered
        .reverse()
        .slice(0, visiblePosts)
        .forEach((post) => {
          const div = document.createElement("div");
          div.className = "post";
          div.innerHTML = `
            <strong>${post.name}</strong>
            <p>${post.message}</p>
            ${
              post.image
                ? `<img src="${post.image}" alt="post image" style="max-width: 100%; border-radius: 10px; margin-top: 10px;" />`
                : ""
            }
            <small>${timeAgo(post.timestamp)}</small>
            <div class="actions">
              <button onclick="likePost('${post.id}', ${post.likes || 0})">❤️ ${
            post.likes || 0
          }</button>
              <button onclick="editPost('${post.id}', \`${post.message.replace(
            /`/g,
            "\\`"
          )}\`)">✏️ Edit</button>
              <button onclick="deletePost('${post.id}')">🗑 Delete</button>
            </div>
          `;

          // 🗨️ Comment Section
          const commentSection = document.createElement("div");
          commentSection.className = "comments";

          // Existing comments
          if (post.comments && post.comments.length > 0) {
            post.comments.forEach((c) => {
              const cDiv = document.createElement("div");
              cDiv.className = "comment";
              cDiv.innerHTML = `<strong>${c.name}</strong>: ${c.text}`;
              commentSection.appendChild(cDiv);
            });
          }

          // Comment form
          const commentForm = document.createElement("div");
          commentForm.className = "comment-form";
          commentForm.innerHTML = `
            <input type="text" placeholder="Your Name" class="comment-name" />
            <input type="text" placeholder="Add a comment..." class="comment-text" />
            <button class="comment-btn">Comment</button>
          `;
          commentSection.appendChild(commentForm);

          // Handle comment submit
          commentForm
            .querySelector(".comment-btn")
            .addEventListener("click", () => {
              const name = commentForm
                .querySelector(".comment-name")
                .value.trim();
              const text = commentForm
                .querySelector(".comment-text")
                .value.trim();
              if (!name || !text)
                return alert("Please fill both name and comment.");

              const newComment = { name, text };
              const updatedComments = post.comments
                ? [...post.comments, newComment]
                : [newComment];

              fetch(`${API}/${post.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comments: updatedComments }),
              }).then(loadPosts);
            });

          div.appendChild(commentSection);
          feed.appendChild(div);
        });

      document.getElementById("loadMore").style.display =
        filtered.length > visiblePosts ? "block" : "none";
    });
}

loadPosts();
