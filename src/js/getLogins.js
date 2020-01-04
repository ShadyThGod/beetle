var domainRegEx = new RegExp('^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)', 'g');
var barredTest = new RegExp('This site has been barred');
var noLoginTest = new RegExp('No logins found');

function request(domain, callback) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState === 4) {
            if (this.status === 200) {
                callback(req.response);
            } else if (this.status !== 200) {
                isError(this.statusText);
            }
        }

    };
    req.responseType = 'document';
    req.open("GET", "http://bugmenot.com/view/" + domain, true);
    req.send();
}

function isBarred(doc) {
    return barredTest.test(doc.querySelector('#content').textContent);
}

function noLogins(doc) {
    return noLoginTest.test(doc.querySelector('#content').textContent);
}

function isError(error) {
    document.querySelector('.error').style.display = 'block';
    document.querySelector('.error').innerHTML = 'Error: ' + error;
}


function accountElement(i, username, password, successRateEl, other) {
    var username = username;
    var password = password;
    var successRateEl = successRateEl;
    var other = other || '';
    return document.createRange().createContextualFragment(`<div class="account" id="account-${i}">
        <div class="username" data-content="${username}">
            <div class="details">
                <div class="icon-user" title="Username"></div>
                <div class="user-text" title="${username}">${username}</div>
            </div>
            <button type="button" class="copy-username icon-copy" title="Copy Username"></button>
        </div>
        <div class="password" data-content="${password}">
            <div class="details">
                <div class="icon-key" title="Password"></div>
                <div class="pass-text" title="${password}">${password}</div>
            </div>
            <button type="button" class="copy-password icon-copy" title="Copy Password"></button>
        </div>
        ${other.length > 0 ? `
        <div class="other" data-content="${other}">
            <div class="details">
                <div class="icon-extra" title="Other Text"></div>
                <div class="other-text" title="${other}">${other}</div>
            </div>
            <button type="button" class="copy-other icon-copy" title="Copy Other"></button>
        </div>
        ` : ''}
        <div class="${successRateEl.className}">${successRateEl.textContent}</div>
        <button title="Fill Password" class="fill-password" data-content="${password}">
            <div class="icon-key"></div>
            <div class="text">Fill Password</div>
        </button>
    </div>`);
}

chrome.tabs.query({
    active: true,
    currentWindow: true
}, function (tabs) {
    var tab = tabs[0];
    var current_domain = domainRegEx.exec(tab.url)[1];
    request(current_domain, function (doc) {
        if (!isBarred(doc)) {
            if (!noLogins(doc)) {
                var accounts = doc.querySelectorAll('.account');
                document.querySelector('.accounts').style.display = 'block';
                accounts.forEach(function (account, i) {
                    var logins = account.querySelectorAll('kbd');
                    var successRateEl = account.querySelector('.success_rate');
                    var username = logins[0].textContent;
                    var password = logins[1].textContent;
                    var other;
                    if (logins[2]) other = logins[2].textContent;
                    var element = accountElement(i, username, password, successRateEl, other);
                    document.querySelector('.accounts').appendChild(element);
                    document.querySelectorAll(`#account-${i} .icon-copy`).forEach(function (i) {
                        i.addEventListener('click', function (e) {
                            let text = e.target.parentElement.getAttribute('data-content');
                            copyToClipboard(text);
                        });
                    });
                    document.querySelectorAll(`#account-${i} .fill-password`).forEach(function (i) {
                        i.addEventListener('click', function () {
                            chrome.tabs.executeScript(tab.id, {
                                code: `document.querySelector(\'input[type="password"]\').value = "${i.getAttribute('data-content')}"`
                            });
                        });
                    });
                });
                var addLoginEl = document.createRange().createContextualFragment(`
                <a class="add-login" target="_blank" href="http://bugmenot.com/submit.php?seed=${current_domain}">
                    Add a Login
                </a>
                `);
                document.querySelector('.content').appendChild(addLoginEl);
            } else {
                isError('No Logins Found');
                var accounts = doc.querySelectorAll('.account');
                document.querySelector('.accounts').style.display = 'block';
                var addLoginEl = document.createRange().createContextualFragment(`
                <a class="add-login" target="_blank" href="http://bugmenot.com/submit.php?seed=${current_domain}">
                    Add a Login
                </a>
                `);
                document.querySelector('.accounts').appendChild(addLoginEl);
            }
        } else {
            isError('Site is barred from BugMeNot');
        }
    });
});

document.querySelector('#toggle-theme').addEventListener('click', function () {
    document.body.classList.toggle('dark');
});