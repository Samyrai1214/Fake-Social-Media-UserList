const INDEX_URL = "https://user-list.alphacamp.io/api/v1/users/";
const noImage = 'https://s2.loli.net/2023/12/28/2eSz5DmQg1Bbfkv.png';
const USERS_PER_PAGE = 15;

const users = JSON.parse(localStorage.getItem("friends"));
let filteredUsers = [];

const dataPanel = document.querySelector("#data-panel");
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const paginator = document.querySelector('#paginator');
const modalRemoveFriend = document.querySelector(".button-remove-friend");

// 函式：顯示主畫面使用者清單
function renderUserList(data) {
  let rawHTML = "";

  data.forEach((item) => {
    item.avatar = item.avatar || noImage;  // 使用者圖片值為null的情況給他「沒有圖片」的圖片
    rawHTML += `
      <div class="card" style="width: 13rem">
        <img class="card-img-top card-show-user" data-bs-toggle="modal" data-bs-target="#user-modal" data-id="${item.id}" src="${item.avatar}" title="Click for More Info" alt="Click User Avatar for More Info">
        <div class="card-body">
          <h4 class="card-title">${item.name} ${item.surname}</h4>
        </div>
        <div class="card-footer">
          <button type="button" id="remove-friend" class="btn panel-remove-friend" style="width: 100%" data-id="${item.id}">Remove friend</button>
        </div>
      </div>
    `;
  });

  dataPanel.innerHTML = rawHTML;
};

// 函式：分頁顯示好友清單
function getFriendsByPage(page) {
  const data = filteredUsers.length ? JSON.parse(localStorage.getItem("searchInFriends")) : users;
  const startIndex = (page - 1) * USERS_PER_PAGE
  const endIndex = page * USERS_PER_PAGE
  return data.slice(startIndex, endIndex)
};

// 函式：計算使用者年齡
function getAge(birthday) {
  const today = new Date();
  const birthDate = new Date(birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
  }
  return age;
};

// 函式：顯示User Modal
function showUserModal(id) {
  const modalTitle = document.querySelector("#user-modal-title");
  const modalEmail = document.querySelector("#user-modal-email");
  const modalImage = document.querySelector("#user-modal-image");
  const modalBirthday = document.querySelector("#user-modal-birthday");
  const modalAge = document.querySelector("#user-modal-age");
  const modalGender = document.querySelector("#user-modal-gender");
  const modalRegion = document.querySelector("#user-modal-region");

  axios.get(INDEX_URL + id).then((response) => {
    const data = response.data;
    const birthday = data.birthday.replace(/(..).(..).(....)/, "$3-$1-$2");
    data.avatar = data.avatar || noImage;  // 使用者圖片值為null的情況給他「沒有圖片」的圖片
    modalTitle.innerText = `${data.name} ${data.surname}`;
    modalEmail.setAttribute("href", `mailto:${data.email}`);
    modalImage.setAttribute("src", data.avatar);
    modalBirthday.innerText = `Birthday: ${birthday}`;
    modalAge.innerText = `Age: ${getAge(birthday)}`;
    modalGender.innerText = `Gender: ${data.gender}`;
    modalRegion.innerText = `From: ${data.region}`;
    modalRemoveFriend.setAttribute("data-id", data.id);
  });
};

// 函式：刪除好友
function removeFriend(id) {
  // 如果要在搜尋結果中(filteredUsers.length=true)刪除好友，需要同時在搜尋結果清單以及好友清單刪除該筆資料
  if (filteredUsers.length) {
    const searchResults = JSON.parse(localStorage.getItem("searchInFriends"))
    const resultIndex = searchResults.findIndex(item => item.id === id)

    // 在搜尋結果清單中將好友移除
    // 分頁顯示好友：刪除第N頁的某位好友後仍然停留在第N頁，若刪除的是最末頁唯一的名單，則跳至前一頁
    // 語法：陣列的長度-1，跟要刪除的resultIndex相減為零，且resultIndex除以每頁顯示數量的餘數為零，則代表刪除的是最末頁唯一的名單。
    //      以此判斷若為true，顯示頁面為刪除名單後的最末頁；若為false，顯示頁面停留在被刪除的名單頁面。
    //      不曉得是否有更簡潔的寫法？
    const page = !(searchResults.length - 1 - resultIndex) && !(resultIndex % USERS_PER_PAGE) ? 
      resultIndex / USERS_PER_PAGE : 
      Math.ceil((resultIndex + 1) / USERS_PER_PAGE);
    searchResults.splice(resultIndex, 1)
    localStorage.setItem("searchInFriends", JSON.stringify(searchResults));

    // 在好友清單中將好友移除
    const userIndex = users.findIndex(user => user.id === id);
    users.splice(userIndex, 1);
    localStorage.setItem("friends", JSON.stringify(users));
    
    // 儲存頁碼，並渲染畫面及分頁選擇器
    localStorage.setItem("friendsPage", page);
    renderPaginator(searchResults.length, page);
    highLightedPage(page);
    renderUserList(getFriendsByPage(page));
  } else {
    if (!users || !users.length) return;
    const userIndex = users.findIndex(user => user.id === id);
    const page = !(users.length - 1 - userIndex) && !(userIndex % USERS_PER_PAGE) ? 
      userIndex / USERS_PER_PAGE : 
      Math.ceil((userIndex + 1) / USERS_PER_PAGE);

    if (userIndex === -1) return;
    users.splice(userIndex, 1);
    localStorage.setItem("friends", JSON.stringify(users));
    localStorage.setItem("friendsPage", page);
    renderPaginator(users.length, page);
    highLightedPage(page);
    renderUserList(getFriendsByPage(page));
  };
};

// 函式：產生分頁器
function renderPaginator(amount, currentPage) {
  let rawHTML = '';
  const pageAmount = Math.ceil(amount / USERS_PER_PAGE);
  const previousPage = `<div aria-hidden="true" class="page-item-arrow btn fa-solid fa-angles-left"></div>`
  const nextPage = `<div aria-hidden="true" class="page-item-arrow btn fa-solid fa-angles-right"></div>`

  rawHTML += previousPage + `
    <div class="dropdown ">
      <button class="btn btn-secondary dropdown-toggle page-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">
        ${currentPage}
      </button>
      <span style="color: #61670d;">/</span>
      <span class="page-amount btn">  ${pageAmount}  </span>
      <ul class="dropdown-menu">
        <li><a class="page-item dropdown-item" href="#" data-page="1">1</a></li>
  `;
  for (let page = 2; page <= pageAmount; page++){
    rawHTML += `
      <li><a class="page-item dropdown-item" href="#" data-page="${page}">${page}</a></li>
    `
  }

  rawHTML +=`
      </ul>
    </div>
  ` + nextPage
  
  paginator.innerHTML = rawHTML;
};

// 函式：分頁器中強調現在頁面、在首尾頁停止「上一頁、下一頁」發生作用
function highLightedPage(page) {
  const data = filteredUsers.length ? 
    JSON.parse(localStorage.getItem("searchInFriends")) : users
  const maxPage = data.length / USERS_PER_PAGE;
  const pageItemNum = document.querySelectorAll('.page-item');
  const pageItemArrow = document.querySelectorAll('.page-item-arrow');

  pageItemNum.forEach(item => {
    item.classList.remove("active");
    item.removeAttribute("aria-current")
    if (Number(item.dataset.page) === page) {
      item.classList.add("active");
      item.setAttribute("aria-current", "page")
    }
  });

  pageItemArrow.forEach(item => {
    item.classList.add("disabled")
    if (page > 1 && !item.classList.contains("fa-angles-right")) {
      item.classList.remove("disabled")
    } else if (page < maxPage && !item.classList.contains("fa-angles-left")) {
      item.classList.remove("disabled")
    }
  });
};

// 渲染主畫面使用者清單（同時清空儲存在localStorage的搜尋結果）
localStorage.removeItem("searchInFriends");
localStorage.setItem("friendsPage", 1);
renderPaginator(users.length, 1);
highLightedPage(1);
renderUserList(getFriendsByPage(1));

// 事件：點擊頁碼或上一頁下一頁，產生對應頁面清單
paginator.addEventListener("click", function onPaginatorClicked(event) {
  const pageBtn = document.querySelector('.page-btn');
  const data = filteredUsers.length ? JSON.parse(localStorage.getItem("searchInFriends")) : users;
  const maxPage = Math.ceil(data.length / USERS_PER_PAGE);

  if (event.target.matches('.page-item')) {
    const page = Number(event.target.dataset.page);
    if (filteredUsers.length) {
      renderUserList(getFriendsByPage(page));
      highLightedPage(page);
    } else {
      renderUserList(getFriendsByPage(page));
      highLightedPage(page);
    }
    pageBtn.innerText = page;
    localStorage.setItem("friendsPage", page);
  } else if (event.target.matches('.fa-angles-left')) {
    const page = JSON.parse(localStorage.getItem("friendsPage")) - 1 || 1;
    renderUserList(getFriendsByPage(page));
    renderPaginator(data.length, page);
    highLightedPage(page);
    localStorage.setItem("friendsPage", JSON.stringify(page));
  } else if (event.target.matches('.fa-angles-right')) {
    const page = JSON.parse(localStorage.getItem("friendsPage")) + 1 >= maxPage ? 
      maxPage : JSON.parse(localStorage.getItem("friendsPage")) + 1;
    renderUserList(getFriendsByPage(page));
    renderPaginator(data.length, page);
    highLightedPage(page);
    localStorage.setItem("friendsPage", JSON.stringify(page))
  };
});

// 事件：點擊顯示User Modal、在好友頁刪除好友
const panelRemoveFriend = document.querySelector(".panel-remove-friend")
dataPanel.addEventListener("click", function onPanelClicked(event) {
  if (event.target.matches(".card-show-user")) {
    showUserModal(event.target.dataset.id);
  } else if (event.target.matches(".panel-remove-friend")) {
    removeFriend(Number(event.target.dataset.id));
  };
});

// 事件：在Modal刪除好友
modalRemoveFriend.addEventListener("click", function onRemoveFriendClicked(event) {
  event.preventDefault();
  removeFriend(Number(event.target.dataset.id));
});

// 事件：在好友清單中搜尋
searchForm.addEventListener("submit", function onSearchFormSubmitted(event) {
  event.preventDefault();
  const keyword = searchInput.value.trim().toLowerCase();
  filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(keyword) || 
    user.surname.toLowerCase().includes(keyword) || 
    `${user.name.toLowerCase()} ${user.surname.toLowerCase()}` === keyword
  );

  if (filteredUsers.length === 0) {
    return alert('很抱歉，沒有符合的使用者')
  };

  // 將搜尋結果儲存在localStorage，以便在搜尋結果中刪除好友使用
  localStorage.setItem("searchInFriends", JSON.stringify(filteredUsers))
  localStorage.setItem("friendsPage", 1)
  renderPaginator(filteredUsers.length, 1);
  highLightedPage(1);
  renderUserList(getFriendsByPage(1));
});


