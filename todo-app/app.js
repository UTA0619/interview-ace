const STORAGE_KEY = 'todo-app-items';

const addForm = document.getElementById('addForm');
const addInput = document.getElementById('addInput');
const todoList = document.getElementById('todoList');
const countEl = document.getElementById('count');
const clearCompletedBtn = document.getElementById('clearCompleted');
const filterBtns = document.querySelectorAll('.filter-btn');

let todos = loadTodos();
let currentFilter = 'all';

function loadTodos() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  todos.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    text: trimmed,
    completed: false,
  });
  saveTodos();
  addInput.value = '';
  render();
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveTodos();
    render();
  }
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  saveTodos();
  render();
}

function clearCompleted() {
  todos = todos.filter((t) => !t.completed);
  saveTodos();
  render();
}

function getFilteredTodos() {
  if (currentFilter === 'active') return todos.filter((t) => !t.completed);
  if (currentFilter === 'completed') return todos.filter((t) => t.completed);
  return todos;
}

function render() {
  const filtered = getFilteredTodos();
  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  todoList.innerHTML = '';
  if (filtered.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-message';
    empty.textContent =
      currentFilter === 'all'
        ? 'タスクがありません。追加してみましょう。'
        : currentFilter === 'active'
          ? '未完了のタスクはありません。'
          : '完了したタスクはありません。';
    todoList.appendChild(empty);
  } else {
    filtered.forEach((todo) => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (todo.completed ? ' completed' : '');
      li.setAttribute('data-id', todo.id);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'todo-checkbox';
      checkbox.checked = todo.completed;
      checkbox.setAttribute('aria-label', todo.completed ? '未完了にする' : '完了にする');
      checkbox.addEventListener('change', () => toggleTodo(todo.id));

      const span = document.createElement('span');
      span.className = 'todo-text';
      span.textContent = todo.text;

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'todo-delete';
      deleteBtn.textContent = '削除';
      deleteBtn.setAttribute('aria-label', 'このタスクを削除');
      deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteBtn);
      todoList.appendChild(li);
    });
  }

  countEl.textContent = `${activeCount} 件のタスク`;
  clearCompletedBtn.style.display = completedCount > 0 ? 'block' : 'none';

  filterBtns.forEach((btn) => {
    const filter = btn.getAttribute('data-filter');
    const isActive = filter === currentFilter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive);
  });
}

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTodo(addInput.value);
});

clearCompletedBtn.addEventListener('click', clearCompleted);

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentFilter = btn.getAttribute('data-filter');
    render();
  });
});

render();
