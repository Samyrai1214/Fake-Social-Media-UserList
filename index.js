const INDEX_URL = "https://user-list.alphacamp.io/api/v1/users/";
const noImage = 'https://s2.loli.net/2023/12/28/2eSz5DmQg1Bbfkv.png';
const modalFriendBtnClass = 'btn btn-outline-secondary modal-friend';
let USERS_PER_PAGE = 10;

const users = [];
let filteredUsers = [];

const dataPanel = document.querySelector("#data-panel");
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const setUsersPerPage = document.querySelector('#users-per-page');
const userAmountBtn = document.querySelector('.user-amount-btn');
const paginator = document.querySelector('#paginator');
const modalFriend = document.querySelector(".modal-friend");

// 函式：顯示主畫面使用者清單
function renderUserList(data) {
  let rawHTML = "";

  data.forEach((item) => {
    item.avatar = item.avatar || noImage;  // 使用者圖片值為null的情況給他「沒有圖片」的圖片
    rawHTML += `
      <div class="card" style="width: 13rem;">
        <img class="card-img-top card-show-user" data-bs-toggle="modal" data-bs-target="#user-modal" data-id="${item.id}" src="${item.avatar}" title="Click for More Info" alt="Click User Avatar for More Info">
        <div class="card-body">
          <h4 class="card-title">${item.name} ${item.surname}</h4>
        </div>
        <div class="card-footer">
          <button type="button" class="btn friend${item.id} button-add-friend" style="width: 100%" data-id="${item.id}">Add friend</button>
        </div>
      </div>
    `
  dataPanel.innerHTML = rawHTML;
  });
};

// 函式：已是好友者顯示移除好友按鈕
function removeFriendButton(data) {
  const list = JSON.parse(localStorage.getItem("friends")) || [];
  let friendButton
  
  data.forEach((item) => {
    friendButton = document.querySelector(`.friend${item.id}`)
    if (list.some(user => user.id === item.id)) {
      friendButton.setAttribute("class", `btn friend${item.id} button-remove-friend`)
      friendButton.innerText = 'Remove Friend'
    };
  })
};

// 函式：分頁顯示使用者清單
function getUsersByPage(page) {
  const data = filteredUsers.length ? filteredUsers : users;

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
    const list = JSON.parse(localStorage.getItem("friends")) || [];
    // 在網路上找到將出生日期格式轉換爲yyyy-mm-dd的方法，不過其實不很懂正規表達式的運作
    const birthday = data.birthday.replace(/(..).(..).(....)/, "$3-$1-$2");
    data.avatar = data.avatar || noImage;  // 使用者圖片值為null的情況給他「沒有圖片」的圖片

    // 填入使用者各項資料
    modalTitle.innerText = `${data.name} ${data.surname}`;
    modalEmail.setAttribute("href", `mailto:${data.email}`);
    modalImage.setAttribute("src", data.avatar);
    modalBirthday.innerText = `Birthday: ${birthday}`;
    modalAge.innerText = `Age: ${getAge(birthday)}`;
    modalGender.innerText = `Gender: ${data.gender}`;
    modalRegion.innerText = `From: ${data.region}`;
    modalFriend.setAttribute("data-id", data.id);

    // 已是好友的話顯示移除好友按鈕；其餘顯示加入好友按鈕
    if ((list.some(friend => friend.id === Number(id)))) {
      modalFriend.setAttribute("class", `${modalFriendBtnClass} button-remove-friend`)
      modalFriend.innerText = 'Remove Friend'
    } else {
      modalFriend.setAttribute("class", `${modalFriendBtnClass} button-add-friend`)
      modalFriend.innerText = 'Add Friend'
    };
  });
};

// 函式：加入好友
function addFriend(id) {
  const list = JSON.parse(localStorage.getItem("friends")) || [];
  const user = users.find(user => user.id === id);
  if (list.some(user => user.id === id)) {
    return alert('好友名單已有此人');
  };
  list.push(user);
  localStorage.setItem("friends", JSON.stringify(list));
};

// 函式：刪除好友
function removeFriend(id) {
  const users = JSON.parse(localStorage.getItem("friends"))
  if (!users || !users.length) return;
  const userIndex = users.findIndex(user => user.id === id);

  if (userIndex === -1) return;
  users.splice(userIndex, 1);
  localStorage.setItem("friends", JSON.stringify(users));
};

// 函式：產生分頁器
// 僅顯示前三頁跟最末頁，以及瀏覽頁面之前後頁
// 並設定總頁數在六頁以內會顯示全部頁碼
function renderPaginator(amount, currentPage) {
  const pageAmount = Math.ceil(amount / USERS_PER_PAGE);
  const previousPage = `
    <li class="page-item page-item-arrow previous-page">
      <a class="page-link previous-page" aria-label="Previous">
        <span class="previous-page" aria-hidden="true">&laquo;</span>
      </a>
    </li>
  `
  const nextPage = `
    <li class="page-item page-item-arrow next-page">
      <a class="page-link next-page" aria-label="Next">
        <span class="next-page" aria-hidden="true">&raquo;</span>
      </a>
    </li>
  `
  const skipPage = `
    <li class="page-item disabled">
      <a class="page-link">...</a>
    </li>
  `
  let rawHTML = '';

  // 「前一頁」
  rawHTML += previousPage;

  // 總頁數在七頁以上，僅顯示前三頁跟最末頁，以及瀏覽頁面之前後頁
  if (pageAmount >= 7) {
    // 固定顯示1~3頁
    for (let page = 1; page <= 3; page ++) {
      rawHTML += `
        <li class="page-item page-item-num" data-page="${page}"><a class="page-link page-link-num" data-page="${page}">${page}</a></li>
      `
    };
    // 瀏覽1~5頁時
    if (currentPage > 0 && currentPage < 6) {
      // 若總頁數剛好七頁，且正瀏覽第五頁，則完全不需省略頁碼
      if (currentPage === 5 && pageAmount === 7) {
        for (let page = 4; page <= (currentPage + 1); page ++) {
          rawHTML += `
            <li class="page-item page-item-num" data-page="${page}"><a class="page-link page-link-num" data-page="${page}">${page}</a></li>
          `
        };
      // 瀏覽1~5頁的其餘情況，與最末頁間皆有省略頁碼
      } else {
        for (let page = 4; page <= (currentPage + 1); page ++) {
          rawHTML += `
            <li class="page-item page-item-num" data-page="${page}"><a class="page-link page-link-num" data-page="${page}">${page}</a></li>
          `
        };
        rawHTML += skipPage
      }
    // 瀏覽第6~倒數第4頁時，前後皆有省略頁碼
    } else if (currentPage > 5 && currentPage < pageAmount - 2) {
      rawHTML += skipPage;
      for (let page = currentPage - 1; page <= currentPage + 1; page ++) {
        rawHTML += `
          <li class="page-item page-item-num" data-page="${page}"><a class="page-link page-link-num" data-page="${page}">${page}</a></li>
        `;
      };
      rawHTML += skipPage;
    // 瀏覽倒數第3頁，與第3頁間有省略。由於亦顯示前後頁碼，後頁已為倒數第二頁，與最末頁間不需省略
    } else if (currentPage === pageAmount - 2) {
      rawHTML += skipPage;
      for (let page = currentPage - 1; page <= currentPage + 1; page ++) {
        rawHTML += `
          <li class="page-item page-item-num" data-page="${page}"><a class="page-link page-link-num" data-page="${page}">${page}</a></li>
        `;
      };
    // 瀏覽倒數第2頁，與第3頁省略、與最末頁沒有省略，並顯示前一頁碼
    } else if (currentPage === pageAmount - 1) {
      rawHTML += skipPage;
      for (let page = currentPage - 1; page <= currentPage; page ++) {
        rawHTML += `
          <li class="page-item page-item-num" data-page="${page}"><a class="page-link page-link-num" data-page="${page}">${page}</a></li>
        `;
      };
    // 瀏覽最末頁時，與第三頁間省略，並顯示前一頁碼
    } else if (currentPage === pageAmount) {
      rawHTML += skipPage;
      rawHTML += `
        <li class="page-item page-item-num" data-page="${currentPage - 1}"><a class="page-link page-link-num" data-page="${currentPage -1}">${currentPage -1}</a></li>
      `;
    };
    // 固定顯示最末頁
    rawHTML += `
      <li class="page-item page-item-num danger" data-page="${pageAmount}"><a class="page-link page-link-num" data-page="${pageAmount}">${pageAmount}</a></li>
      `
    // 若使用者清單在六頁以內，則顯示所有頁碼
  } else if (pageAmount > 0 && pageAmount < 7) {
    for (let page = 1; page <= pageAmount; page ++) {
    rawHTML += `
      <li class="page-item page-item-num" data-page="${page}"><a class="page-link page-link-num" data-page="${page}">${page}</a></li>
    `
    };
  } 
  // 「下一頁」
  rawHTML += nextPage;

  paginator.innerHTML = rawHTML;
};

// 函式：分頁器中強調現在頁面、在首尾頁停止「上一頁、下一頁」發生作用
function highLightedPage(page) {
  const maxPage = filteredUsers.length ? 
    Math.ceil(filteredUsers.length / USERS_PER_PAGE) : 
    Math.ceil(users.length / USERS_PER_PAGE);
  const pageItemNum = document.querySelectorAll('.page-item-num');
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
    if (page > 1 && !item.classList.contains("next-page")) {
      item.classList.remove("disabled")
    } else if (page < maxPage && !item.classList.contains("previous-page")) {
      item.classList.remove("disabled")
    }
  });
};


// 渲染主畫面使用者清單
axios.get(INDEX_URL).then((response) => {
  users.push(...response.data.results);
  renderPaginator(users.length, 1);
  highLightedPage(1)
  renderUserList(getUsersByPage(1));
  removeFriendButton(getUsersByPage(1))
  localStorage.setItem("page", 1)
});

// 事件：選擇每頁顯示人數並刷新頁面
setUsersPerPage.addEventListener("click", function onAmountOfUserClicked(event) {
  const data = filteredUsers.length ? filteredUsers : users;
  const userAmount = document.querySelectorAll('.user-amount')
  if (event.target.matches('.user-amount')) {
    userAmountBtn.innerText = event.target.innerText;
    USERS_PER_PAGE = Number(event.target.dataset.amount);

    renderPaginator(data.length, 1);
    highLightedPage(1);
    renderUserList(getUsersByPage(1));
    removeFriendButton(getUsersByPage(1))
    localStorage.setItem("page", "1")

    userAmount.forEach(element => {
      element.classList.remove('active')
    });
    event.target.classList.add('active')
  };
})

// 事件：點擊頁碼或上一頁下一頁，產生對應的使用者清單，並更新分頁器
paginator.addEventListener("click", function onPaginatorClicked(event) {
  const data = filteredUsers.length ? filteredUsers : users
  const maxPage = Math.ceil(data.length / USERS_PER_PAGE)

  if (event.target.matches('.page-link-num')) {
    // 點擊頁碼時的行為
    const page = Number(event.target.dataset.page);
    renderUserList(getUsersByPage(page));
    removeFriendButton(getUsersByPage(page))
    renderPaginator(data.length, page);
    highLightedPage(page);
    localStorage.setItem("page", page);
  } else if (event.target.matches('.previous-page')) {
    // 點擊「上一頁」時，將儲存的頁碼取出減1，減到1為止不會再減
    const page = JSON.parse(localStorage.getItem("page")) - 1 || 1;
    renderUserList(getUsersByPage(page));
    removeFriendButton(getUsersByPage(page))
    renderPaginator(data.length, page);
    highLightedPage(page);
    localStorage.setItem("page", JSON.stringify(page));
  } else if (event.target.matches('.next-page')) {
    // 點擊「下一頁」時，將儲存的頁碼取出加1，加到最大頁數為止不會再加
    const page = JSON.parse(localStorage.getItem("page")) + 1 >= maxPage ? 
      maxPage : JSON.parse(localStorage.getItem("page")) + 1;
    renderUserList(getUsersByPage(page));
    removeFriendButton(getUsersByPage(page))
    renderPaginator(data.length, page);
    highLightedPage(page);
    localStorage.setItem("page", JSON.stringify(page))
  };
});

// 事件：點擊顯示User Modal、在使用者清單加入好友、在使用者清單移除好友
dataPanel.addEventListener("click", function onPanelClicked(event) {
  const TARGET = event.target;
  if (TARGET.matches(".card-show-user")) {
    showUserModal(TARGET.dataset.id);
  } else if (TARGET.matches(".button-add-friend")) {
    // const TARGET = event.target;
    addFriend(Number(TARGET.dataset.id));

    // 加入好友按鈕改為移除好友
    TARGET.setAttribute("class", `btn friend${TARGET.dataset.id} button-remove-friend`)
    TARGET.innerText = 'Remove Friend'

  } else if (TARGET.matches(".button-remove-friend")) {
    // const TARGET = event.target;
    removeFriend(Number(TARGET.dataset.id));

    // 移除好友按鈕改為加入好友
    TARGET.setAttribute("class", `btn friend${TARGET.dataset.id} button-add-friend`)
    TARGET.innerText = 'Add Friend'
  };
});

// 事件：在Modal加入好友、移除好友
modalFriend.addEventListener("click", function onAddFriendClicked(event) {
  event.preventDefault();
  const TARGET = event.target;
  const dataPanelTarget = document.querySelector(`.friend${TARGET.dataset.id}`);

  // 點擊加入好友
  if (TARGET.matches(".button-add-friend")) {
    addFriend(Number(TARGET.dataset.id));
    showUserModal(Number(TARGET.dataset.id));
    renderUserList(getUsersByPage(Math.ceil(Number(TARGET.dataset.id) / USERS_PER_PAGE)));
    removeFriendButton(getUsersByPage(Math.ceil(Number(TARGET.dataset.id) / USERS_PER_PAGE)))

    // 點擊移除好友
  } else if (TARGET.matches(".button-remove-friend")) {
    removeFriend(Number(TARGET.dataset.id));

    // Modal內之移除好友按鈕改為加入好友
    // 跟加入好友時一樣，可以選擇重新渲染一次這個Modal，或者單獨修改按鈕的class以及文字，在這邊選擇使用單獨修改按鈕
    // 但是，上述兩種方法哪一個是比較好的？或者說對於記憶體的使用效率來說有沒有差別？
    TARGET.setAttribute("class", `${modalFriendBtnClass} button-add-friend`)
    TARGET.innerText = 'Add Friend'
    
    //dataPanel上移除好友的按鈕也要改成加入好友
    dataPanelTarget.setAttribute("class", `btn friend${TARGET.dataset.id} button-add-friend`)
    dataPanelTarget.innerText = 'Add Friend'
  }
});


// 事件：搜尋使用者
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

  localStorage.setItem("page", 1)
  renderPaginator(filteredUsers.length, 1);
  highLightedPage(1);
  renderUserList(getUsersByPage(1));
  removeFriendButton(getUsersByPage(1))
});
