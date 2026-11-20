'use strict';

const API_URL = 'https://jsonplaceholder.typicode.com';

// Получаем ссылки на элементы DOM один раз, чтобы использовать их в функциях.
const loadButton = document.querySelector('#load-users');
const searchInput = document.querySelector('#search');
const usersContainer = document.querySelector('#users');
const postsContainer = document.querySelector('#posts');
const usersStatus = document.querySelector('#users-status');
const postsStatus = document.querySelector('#posts-status');
const postsTitle = document.querySelector('#posts-title');

// Храним исходный список в памяти: поиск не требует дополнительных запросов.
let users = [];
let isLoading = false;

// textContent отображает данные как обычный текст, а не как HTML-разметку.
function createTextElement(tag, text, className = '') {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
}

function setStatus(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle('error', isError);
}

// fetch не выбрасывает исключение при HTTP 404/500, поэтому проверяем response.ok.
async function getJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
}

// Блокировка предотвращает одновременные запросы и случайные повторные нажатия.
function setLoading(value) {
    isLoading = value;
    loadButton.disabled = value;
    searchInput.disabled = value || users.length === 0;
    usersContainer.querySelectorAll('button').forEach(button => {
        button.disabled = value;
    });
}

// Формируем карточки из переданного списка. Исходный массив не изменяется.
function renderUsers(list) {
    usersContainer.textContent = '';
    if (list.length === 0) {
        setStatus(usersStatus, 'Пользователи не найдены');
        return;
    }

    setStatus(usersStatus, `Найдено пользователей: ${list.length}`);
    for (const user of list) {
        const card = document.createElement('article');
        card.className = 'card user-card';

        card.append(
            createTextElement('h3', user.name),
            createTextElement('p', `Email: ${user.email}`),
            createTextElement('p', `Город: ${user.address.city}`)
        );

        const button = createTextElement('button', 'Показать публикации');
        button.type = 'button';
        button.disabled = isLoading;
        // Замыкание сохраняет конкретного пользователя для его кнопки.
        button.addEventListener('click', () => loadPosts(user));
        card.append(button);
        usersContainer.append(card);
    }
}

function filterUsers() {
    // trim удаляет лишние пробелы, а toLowerCase делает поиск нечувствительным к регистру.
    const query = searchInput.value.trim().toLowerCase();
    const filtered = users.filter(user => user.name.toLowerCase().includes(query));
    renderUsers(filtered);
}

async function loadUsers() {
    if (isLoading) return;
    setLoading(true);
    setStatus(usersStatus, 'Загрузка...');

    try {
        users = await getJson(`${API_URL}/users`);
        searchInput.value = '';
        renderUsers(users);

        // После обновления справочника очищаем публикации предыдущего пользователя.
        postsContainer.textContent = '';
        postsTitle.textContent = 'Публикации';
        setStatus(postsStatus, 'Выберите пользователя для просмотра публикаций.');
    } catch (error) {
        // При сбое оставляем ранее загруженные данные и предлагаем повторить запрос.
        setStatus(usersStatus, `Ошибка загрузки пользователей: ${error.message}. Попробуйте ещё раз.`, true);
    } finally {
        // Выполняется и при успешном ответе, и при исключении.
        setLoading(false);
    }
}

async function loadPosts(user) {
    if (isLoading) return;
    setLoading(true);
    postsTitle.textContent = `Публикации: ${user.name}`;
    postsContainer.textContent = '';
    setStatus(postsStatus, 'Загрузка...');

    try {
        // Передаём реальный ID пользователя в параметре GET-запроса.
        const posts = await getJson(`${API_URL}/posts?userId=${user.id}`);
        const firstThree = posts.slice(0, 3);

        for (const post of firstThree) {
            const card = document.createElement('article');
            card.className = 'card';
            card.append(createTextElement('h3', post.title), createTextElement('p', post.body));
            postsContainer.append(card);
        }

        setStatus(postsStatus, firstThree.length ? `Показано публикаций: ${firstThree.length}` : 'Публикаций нет');
    } catch (error) {
        setStatus(postsStatus, `Ошибка загрузки публикаций: ${error.message}. Нажмите кнопку ещё раз.`, true);
    } finally {
        setLoading(false);
    }
}

// Обработчики запускают действия без перезагрузки страницы.
loadButton.addEventListener('click', loadUsers);
searchInput.addEventListener('input', filterUsers);
