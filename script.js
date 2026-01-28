// DOM Elements
const itemForm = document.getElementById('item-form');
const itemInput = document.getElementById('item-input');
const quantityInput = document.getElementById('quantity-input');
const categoryInput = document.getElementById('category-input');
const priorityInput = document.getElementById('priority-input');
const notesInput = document.getElementById('notes-input');
const itemList = document.getElementById('item-list');
const clearBtn = document.getElementById('clear');
const clearPurchasedBtn = document.getElementById('clear-purchased');
const itemFilter = document.getElementById('filter');
const categoryFilter = document.getElementById('category-filter');
const sortItems = document.getElementById('sort-items');
const formBtn = document.getElementById('form-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const toggleViewBtn = document.getElementById('toggle-view');
const emptyState = document.getElementById('empty-state');
const totalItemsSpan = document.getElementById('total-items');
const purchasedItemsSpan = document.getElementById('purchased-items');

let isEditMode = false;
let editItemId = null;
let draggedElement = null;

// Category Icons
const categoryIcons = {
  general: 'fa-list',
  produce: 'fa-apple-alt',
  dairy: 'fa-cheese',
  meat: 'fa-drumstick-bite',
  bakery: 'fa-bread-slice',
  beverages: 'fa-coffee',
  snacks: 'fa-cookie',
  frozen: 'fa-snowflake',
  household: 'fa-home',
  personal: 'fa-pump-soap'
};

// Initialize app
function init() {
  // Event listeners
  itemForm.addEventListener('submit', onAddItemSubmit);
  itemList.addEventListener('click', onItemClick);
  clearBtn.addEventListener('click', clearAllItems);
  clearPurchasedBtn.addEventListener('click', clearPurchasedItems);
  itemFilter.addEventListener('input', filterItems);
  categoryFilter.addEventListener('change', filterItems);
  sortItems.addEventListener('change', sortAndDisplayItems);
  cancelEditBtn.addEventListener('click', cancelEdit);
  toggleViewBtn.addEventListener('click', toggleView);
  document.addEventListener('DOMContentLoaded', displayItems);

  checkUI();
}

// Display items from storage
function displayItems() {
  const items = getItemsFromStorage();
  itemList.innerHTML = '';
  
  const sortedItems = sortItemsArray(items);
  sortedItems.forEach(item => addItemToDOM(item));
  
  checkUI();
}

// Add item on form submit
function onAddItemSubmit(e) {
  e.preventDefault();
  
  const itemName = itemInput.value.trim();
  
  // Validate input
  if (itemName === '') {
    showNotification('Please enter an item name', 'error');
    itemInput.classList.add('shake');
    setTimeout(() => itemInput.classList.remove('shake'), 300);
    return;
  }
  
  if (isEditMode) {
    // Update existing item
    updateItem(editItemId);
  } else {
    // Check if item exists
    if (checkItemExists(itemName)) {
      showNotification('That item already exists!', 'error');
      return;
    }
    
    // Create new item
    const newItem = {
      id: generateId(),
      name: itemName,
      quantity: parseInt(quantityInput.value) || 1,
      category: categoryInput.value,
      priority: priorityInput.value,
      notes: notesInput.value.trim(),
      purchased: false,
      timestamp: new Date().toISOString()
    };
    
    addItemToDOM(newItem);
    addItemToStorage(newItem);
    showNotification('Item added successfully!', 'success');
  }
  
  resetForm();
  checkUI();
}

// Add item to DOM
function addItemToDOM(item) {
  const li = document.createElement('li');
  li.setAttribute('data-id', item.id);
  li.draggable = true;
  
  if (item.purchased) {
    li.classList.add('purchased');
  }
  
  li.innerHTML = `
    <div class="item-header">
      <div class="item-main">
        <div class="item-title">
          <span class="item-name">${item.name}</span>
          ${item.quantity > 1 ? `<span class="item-quantity">×${item.quantity}</span>` : ''}
        </div>
        <div class="item-meta">
          <span class="item-category">
            <i class="fas ${categoryIcons[item.category]} category-icon"></i>
            ${capitalizeFirst(item.category)}
          </span>
          <span class="item-priority ${item.priority}">
            <i class="fas fa-flag"></i>
            ${capitalizeFirst(item.priority)}
          </span>
        </div>
        ${item.notes ? `<div class="item-notes"><i class="fas fa-sticky-note"></i> ${item.notes}</div>` : ''}
        <div class="item-timestamp">
          <i class="far fa-clock"></i>
          ${formatTimestamp(item.timestamp)}
        </div>
      </div>
      <div class="item-actions">
        <button class="action-btn purchase" title="${item.purchased ? 'Mark as not purchased' : 'Mark as purchased'}">
          <i class="fas ${item.purchased ? 'fa-undo' : 'fa-check-circle'}"></i>
        </button>
        <button class="action-btn edit" title="Edit item">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete" title="Delete item">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;
  
  // Add drag and drop event listeners
  li.addEventListener('dragstart', handleDragStart);
  li.addEventListener('dragend', handleDragEnd);
  li.addEventListener('dragover', handleDragOver);
  li.addEventListener('drop', handleDrop);
  
  itemList.appendChild(li);
}

// Handle item clicks (edit, delete, purchase)
function onItemClick(e) {
  const listItem = e.target.closest('li');
  if (!listItem) return;
  
  if (e.target.closest('.delete')) {
    deleteItem(listItem);
  } else if (e.target.closest('.edit')) {
    setItemToEdit(listItem);
  } else if (e.target.closest('.purchase')) {
    togglePurchased(listItem);
  }
}

// Toggle purchased status
function togglePurchased(listItem) {
  const id = listItem.getAttribute('data-id');
  const items = getItemsFromStorage();
  const item = items.find(i => i.id === id);
  
  if (item) {
    item.purchased = !item.purchased;
    localStorage.setItem('items', JSON.stringify(items));
    
    listItem.classList.toggle('purchased');
    const purchaseBtn = listItem.querySelector('.purchase');
    const icon = purchaseBtn.querySelector('i');
    
    if (item.purchased) {
      icon.className = 'fas fa-undo';
      purchaseBtn.title = 'Mark as not purchased';
      showNotification('Item marked as purchased', 'success');
    } else {
      icon.className = 'fas fa-check-circle';
      purchaseBtn.title = 'Mark as purchased';
      showNotification('Item marked as not purchased', 'info');
    }
    
    updateStats();
  }
}

// Set item to edit mode
function setItemToEdit(listItem) {
  isEditMode = true;
  editItemId = listItem.getAttribute('data-id');
  
  // Remove edit-mode class from all items
  itemList.querySelectorAll('li').forEach(item => item.classList.remove('edit-mode'));
  listItem.classList.add('edit-mode');
  
  const items = getItemsFromStorage();
  const item = items.find(i => i.id === editItemId);
  
  if (item) {
    itemInput.value = item.name;
    quantityInput.value = item.quantity;
    categoryInput.value = item.category;
    priorityInput.value = item.priority;
    notesInput.value = item.notes || '';
    
    formBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Update Item';
    cancelEditBtn.style.display = 'inline-flex';
    
    // Scroll to form
    itemForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Update item
function updateItem(id) {
  const items = getItemsFromStorage();
  const itemIndex = items.findIndex(i => i.id === id);
  
  if (itemIndex !== -1) {
    items[itemIndex] = {
      ...items[itemIndex],
      name: itemInput.value.trim(),
      quantity: parseInt(quantityInput.value) || 1,
      category: categoryInput.value,
      priority: priorityInput.value,
      notes: notesInput.value.trim()
    };
    
    localStorage.setItem('items', JSON.stringify(items));
    displayItems();
    showNotification('Item updated successfully!', 'success');
  }
}

// Cancel edit mode
function cancelEdit() {
  resetForm();
  itemList.querySelectorAll('li').forEach(item => item.classList.remove('edit-mode'));
}

// Delete item
function deleteItem(listItem) {
  if (confirm('Are you sure you want to delete this item?')) {
    const id = listItem.getAttribute('data-id');
    removeItemFromStorage(id);
    
    listItem.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      listItem.remove();
      checkUI();
      showNotification('Item deleted', 'info');
    }, 300);
  }
}

// Clear all items
function clearAllItems() {
  if (confirm('Are you sure you want to clear all items?')) {
    localStorage.removeItem('items');
    itemList.innerHTML = '';
    checkUI();
    showNotification('All items cleared', 'info');
  }
}

// Clear purchased items
function clearPurchasedItems() {
  const items = getItemsFromStorage();
  const unpurchasedItems = items.filter(item => !item.purchased);
  
  if (items.length === unpurchasedItems.length) {
    showNotification('No purchased items to clear', 'info');
    return;
  }
  
  if (confirm('Clear all purchased items?')) {
    localStorage.setItem('items', JSON.stringify(unpurchasedItems));
    displayItems();
    showNotification('Purchased items cleared', 'success');
  }
}

// Filter items
function filterItems() {
  const searchText = itemFilter.value.toLowerCase();
  const categoryValue = categoryFilter.value;
  const items = itemList.querySelectorAll('li');
  
  items.forEach(item => {
    const itemName = item.querySelector('.item-name').textContent.toLowerCase();
    const itemCategory = item.querySelector('.item-category').textContent.toLowerCase();
    
    const matchesSearch = itemName.includes(searchText);
    const matchesCategory = categoryValue === 'all' || itemCategory.includes(categoryValue);
    
    if (matchesSearch && matchesCategory) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

// Sort and display items
function sortAndDisplayItems() {
  displayItems();
}

// Sort items array
function sortItemsArray(items) {
  const sortValue = sortItems.value;
  
  return [...items].sort((a, b) => {
    switch (sortValue) {
      case 'date-desc':
        return new Date(b.timestamp) - new Date(a.timestamp);
      case 'date-asc':
        return new Date(a.timestamp) - new Date(b.timestamp);
      case 'priority':
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case 'category':
        return a.category.localeCompare(b.category);
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
}

// Toggle view (grid/list)
function toggleView() {
  const icon = toggleViewBtn.querySelector('i');
  
  if (itemList.classList.contains('grid-view')) {
    itemList.classList.remove('grid-view');
    itemList.classList.add('list-view');
    icon.className = 'fas fa-th-large';
  } else {
    itemList.classList.remove('list-view');
    itemList.classList.add('grid-view');
    icon.className = 'fas fa-th';
  }
}

// Drag and Drop handlers
function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  itemList.querySelectorAll('li').forEach(item => {
    item.classList.remove('drag-over');
  });
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  
  e.dataTransfer.dropEffect = 'move';
  
  if (this !== draggedElement) {
    this.classList.add('drag-over');
  }
  
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  if (draggedElement !== this) {
    const allItems = Array.from(itemList.querySelectorAll('li'));
    const draggedIndex = allItems.indexOf(draggedElement);
    const targetIndex = allItems.indexOf(this);
    
    if (draggedIndex < targetIndex) {
      this.parentNode.insertBefore(draggedElement, this.nextSibling);
    } else {
      this.parentNode.insertBefore(draggedElement, this);
    }
    
    // Update order in storage
    updateItemOrder();
  }
  
  this.classList.remove('drag-over');
  return false;
}

// Update item order in storage
function updateItemOrder() {
  const items = getItemsFromStorage();
  const orderedItems = Array.from(itemList.querySelectorAll('li')).map(li => {
    const id = li.getAttribute('data-id');
    return items.find(item => item.id === id);
  });
  
  localStorage.setItem('items', JSON.stringify(orderedItems));
}

// Storage functions
function getItemsFromStorage() {
  let items;
  if (localStorage.getItem('items') === null) {
    items = [];
  } else {
    items = JSON.parse(localStorage.getItem('items'));
  }
  return items;
}

function addItemToStorage(item) {
  const items = getItemsFromStorage();
  items.push(item);
  localStorage.setItem('items', JSON.stringify(items));
}

function removeItemFromStorage(id) {
  let items = getItemsFromStorage();
  items = items.filter(item => item.id !== id);
  localStorage.setItem('items', JSON.stringify(items));
}

function checkItemExists(name) {
  const items = getItemsFromStorage();
  return items.some(item => item.name.toLowerCase() === name.toLowerCase());
}

// Utility functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return diffMinutes === 0 ? 'Just now' : `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function showNotification(message, type = 'info') {
  // Simple notification - you could enhance this with a toast library
  console.log(`${type.toUpperCase()}: ${message}`);
  // You could add a toast notification here
}

function updateStats() {
  const items = getItemsFromStorage();
  const purchasedCount = items.filter(item => item.purchased).length;
  
  totalItemsSpan.textContent = items.length;
  purchasedItemsSpan.textContent = purchasedCount;
}

function resetForm() {
  itemInput.value = '';
  quantityInput.value = '1';
  categoryInput.value = 'general';
  priorityInput.value = 'medium';
  notesInput.value = '';
  
  formBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Item';
  cancelEditBtn.style.display = 'none';
  
  isEditMode = false;
  editItemId = null;
}

function checkUI() {
  const items = itemList.querySelectorAll('li');
  
  if (items.length === 0) {
    clearBtn.style.display = 'none';
    clearPurchasedBtn.style.display = 'none';
    itemFilter.style.display = 'none';
    categoryFilter.parentElement.style.display = 'none';
    emptyState.classList.add('show');
  } else {
    clearBtn.style.display = 'block';
    clearPurchasedBtn.style.display = 'block';
    itemFilter.style.display = 'block';
    categoryFilter.parentElement.style.display = 'flex';
    emptyState.classList.remove('show');
  }
  
  updateStats();
  resetForm();
}

// Add CSS animation for slide out
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }
`;
document.head.appendChild(style);

// Add sample items
function addSampleItems() {
  const sampleItems = [
    // Produce
    { id: generateId(), name: 'Fresh Apples', quantity: 6, category: 'produce', priority: 'medium', notes: 'Granny Smith or Honeycrisp', purchased: false, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Bananas', quantity: 1, category: 'produce', priority: 'high', notes: 'Bunch of 5-6', purchased: false, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Tomatoes', quantity: 4, category: 'produce', priority: 'medium', notes: 'Vine-ripened', purchased: false, timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Lettuce', quantity: 1, category: 'produce', priority: 'low', notes: 'Romaine or Iceberg', purchased: true, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Carrots', quantity: 2, category: 'produce', priority: 'medium', notes: '1 lb bag', purchased: false, timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
    
    // Dairy
    { id: generateId(), name: 'Whole Milk', quantity: 2, category: 'dairy', priority: 'high', notes: '1 gallon each', purchased: false, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Cheddar Cheese', quantity: 1, category: 'dairy', priority: 'medium', notes: 'Sharp, block', purchased: false, timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Greek Yogurt', quantity: 4, category: 'dairy', priority: 'medium', notes: 'Plain, non-fat', purchased: true, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Butter', quantity: 2, category: 'dairy', priority: 'low', notes: 'Unsalted', purchased: false, timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
    
    // Meat & Seafood
    { id: generateId(), name: 'Chicken Breast', quantity: 2, category: 'meat', priority: 'high', notes: 'Boneless, skinless, 2 lbs', purchased: false, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Ground Beef', quantity: 1, category: 'meat', priority: 'medium', notes: '80/20, 1 lb', purchased: false, timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Salmon Fillets', quantity: 3, category: 'meat', priority: 'medium', notes: 'Fresh, wild-caught', purchased: false, timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString() },
    
    // Bakery
    { id: generateId(), name: 'Whole Wheat Bread', quantity: 2, category: 'bakery', priority: 'high', notes: 'Sliced loaf', purchased: false, timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Bagels', quantity: 6, category: 'bakery', priority: 'low', notes: 'Everything flavor', purchased: true, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Croissants', quantity: 4, category: 'bakery', priority: 'low', notes: 'Fresh baked', purchased: false, timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
    
    // Beverages
    { id: generateId(), name: 'Orange Juice', quantity: 1, category: 'beverages', priority: 'medium', notes: 'Pulp-free, 64 oz', purchased: false, timestamp: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Coffee Beans', quantity: 1, category: 'beverages', priority: 'high', notes: 'Medium roast, 12 oz', purchased: false, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Sparkling Water', quantity: 12, category: 'beverages', priority: 'low', notes: 'Lemon flavored', purchased: false, timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString() },
    
    // Snacks
    { id: generateId(), name: 'Potato Chips', quantity: 2, category: 'snacks', priority: 'low', notes: 'Sea salt flavor', purchased: true, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Almonds', quantity: 1, category: 'snacks', priority: 'medium', notes: 'Roasted, unsalted, 16 oz', purchased: false, timestamp: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Granola Bars', quantity: 1, category: 'snacks', priority: 'medium', notes: 'Chocolate chip, box of 12', purchased: false, timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString() },
    
    // Frozen
    { id: generateId(), name: 'Frozen Peas', quantity: 2, category: 'frozen', priority: 'medium', notes: '16 oz bags', purchased: false, timestamp: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Ice Cream', quantity: 1, category: 'frozen', priority: 'low', notes: 'Vanilla, 1.5 quart', purchased: false, timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Frozen Pizza', quantity: 2, category: 'frozen', priority: 'low', notes: 'Pepperoni', purchased: true, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    
    // Household
    { id: generateId(), name: 'Paper Towels', quantity: 1, category: 'household', priority: 'high', notes: '6-pack', purchased: false, timestamp: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Dish Soap', quantity: 1, category: 'household', priority: 'medium', notes: 'Lemon scent', purchased: false, timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Laundry Detergent', quantity: 1, category: 'household', priority: 'medium', notes: 'Free & clear, 100 oz', purchased: false, timestamp: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString() },
    
    // Personal Care
    { id: generateId(), name: 'Toothpaste', quantity: 2, category: 'personal', priority: 'high', notes: 'Whitening formula', purchased: false, timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Shampoo', quantity: 1, category: 'personal', priority: 'medium', notes: 'For dry hair, 12 oz', purchased: false, timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Hand Soap', quantity: 3, category: 'personal', priority: 'medium', notes: 'Lavender scent', purchased: true, timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }
  ];
  
  localStorage.setItem('items', JSON.stringify(sampleItems));
}

// Initialize
addSampleItems();
init();
