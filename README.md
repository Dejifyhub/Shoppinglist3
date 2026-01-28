# 🛒 Shopping List App

A simple and interactive **Shopping List web application** built with **Vanilla JavaScript**, HTML, and CSS. The app allows users to add, edit, delete, filter, and persist shopping items using **Local Storage**.

---

## ✨ Features

* ➕ Add new shopping items
* ✏️ Edit existing items
* ❌ Delete individual items
* 🧹 Clear all items at once
* 🔍 Live filter/search through items
* 💾 Persistent storage using `localStorage`
* 🎛️ Dynamic UI updates based on app state

---

## 🧠 How It Works (High-Level)

1. Items are added via a form input.
2. Items are displayed dynamically in a list (`<li>` elements).
3. All items are saved to the browser's `localStorage` so they persist after page reload.
4. Clicking an item enables **edit mode**.
5. Clicking the ❌ icon deletes an item.
6. The filter input allows real-time searching through items.

---

## 🧰 Technologies Used

* **HTML5** – Structure
* **CSS3** – Styling
* **JavaScript (ES6)** – Functionality
* **Font Awesome** – Icons
* **Browser Local Storage** – Data persistence

---

## 📂 Project Structure

```text
shopping-list/
│
├── index.html      # App markup
├── style.css       # Styling
├── script.js       # App logic
└── README.md       # Project documentation
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/shopping-list-app.git
```

### 2. Open the project

Simply open `index.html` in your browser.

No build tools or dependencies required.

---

## 📝 Usage

* Type an item into the input field and click **Add Item**
* Click an item to edit it
* Click the ❌ icon to remove an item
* Use the filter box to search items
* Click **Clear All** to remove everything

---

## 🔄 App State Management

The app uses a boolean flag:

```js
let isEditmode = false;
```

This flag determines whether the form is:

* Adding a new item
* Updating an existing item

UI elements update automatically based on this state.

---

## ⚠️ Known Limitations

* Items are stored as plain strings (no IDs)
* Duplicate checking is case-sensitive
* No backend (client-side only)

---

## 🔮 Possible Improvements

* Add item quantities or categories
* Case-insensitive duplicate detection
* Use unique IDs instead of text comparison
* Convert to React or Vue
* Add drag-and-drop sorting
* Improve accessibility (ARIA labels)

---

## 👨‍💻 Author

**Omotosho Ayodeji**

---

## 📄 License

This project is open source and available under the **MIT License**.

---

Happy coding! 🚀
